from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db.models import Sum, Count, F, Avg, Case, When, Value, IntegerField
from django.db.models.functions import TruncDate, ExtractWeekDay
from django.utils import timezone
from datetime import timedelta
from .models import Invoice, Payment
from users.models import Business

from rest_framework.exceptions import PermissionDenied

from users.mixins import BusinessContextMixin

class AnalyticsBaseView(BusinessContextMixin, APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_business(self, request):
        business = self.get_active_business()
            
        if not business:
             raise PermissionDenied("Biznes profili tapılmadı və ya icazəniz yoxdur.")
        return business

class PaymentAnalyticsView(AnalyticsBaseView):
    def get(self, request):
        business = self.get_business(request)

        # Base QS
        payments = Payment.objects.filter(invoice__business=business)
        invoices = Invoice.objects.filter(business=business, status='paid')

        # 1. Payment Behavior
        total_payments_count = payments.count()
        on_time_payments = payments.filter(payment_date__lte=F('invoice__due_date')).count()
        late_payments = total_payments_count - on_time_payments
        
        on_time_percentage = (on_time_payments / total_payments_count * 100) if total_payments_count > 0 else 0
        late_percentage = (late_payments / total_payments_count * 100) if total_payments_count > 0 else 0

        # Avg overdue days for LATE payments
        late_payments_qs = payments.filter(payment_date__gt=F('invoice__due_date'))
        avg_overdue_days = 0
        if late_payments_qs.exists():
            # Calculate difference in days
            # SQLite/Postgres compatibility might vary for date diffs in simple aggregate
            # Doing python side calculation for simplicity and robustness across DBs for now
            total_late_days = sum((p.payment_date - p.invoice.due_date).days for p in late_payments_qs)
            avg_overdue_days = total_late_days / late_payments_qs.count()

        # 2. Payment Heatmap
        # Group by date
        # Since payment_date is already a DateField, we can group by it directly without TruncDate
        heatmap_data = payments.values('payment_date').annotate(count=Count('id'), total_amount=Sum('amount')).order_by('payment_date')
        
        formatted_heatmap = []
        for h in heatmap_data:
            formatted_heatmap.append({
                'date': h['payment_date'].strftime('%Y-%m-%d'),
                'count': h['count'],
                'value': float(h['total_amount'])
            })

        # 3. Payment Methods
        methods_data = payments.values('payment_method').annotate(count=Count('id'), total_amount=Sum('amount'))
        formatted_methods = []
        for m in methods_data:
            method_name = m['payment_method'] if m['payment_method'] else 'Digər'
            formatted_methods.append({
                'name': method_name,
                'count': m['count'],
                'amount': float(m['total_amount'])
            })

        # 4. Payment Speed Analysis (Days from Invoice Date to Payment Date)
        # 0-7, 8-14, 15-30, 30+
        speed_buckets = {
            '0-7 gün': 0,
            '8-14 gün': 0,
            '15-30 gün': 0,
            '30+ gün': 0
        }
        
        # We fetch minimal fields to iterate
        all_payments_dates = payments.select_related('invoice').only('payment_date', 'invoice__invoice_date')
        
        for p in all_payments_dates:
            days_taken = (p.payment_date - p.invoice.invoice_date).days
            if days_taken <= 7:
                speed_buckets['0-7 gün'] += 1
            elif days_taken <= 14:
                speed_buckets['8-14 gün'] += 1
            elif days_taken <= 30:
                speed_buckets['15-30 gün'] += 1
            else:
                speed_buckets['30+ gün'] += 1

        total_speed_count = sum(speed_buckets.values())
        formatted_speed = []
        for label, count in speed_buckets.items():
            percent = (count / total_speed_count * 100) if total_speed_count > 0 else 0
            formatted_speed.append({
                'range': label,
                'count': count,
                'percentage': round(percent, 1)
            })

        # 5. Customer Rating
        # Calculate avg payment delay per client
        # Delay = Payment Date - Due Date (Negative means early/on-time, Positive means late)
        
        clients_analytics = {}
        
        for p in all_payments_dates:
            client_name = p.invoice.client.name
            client_id = p.invoice.client.id
            delay = (p.payment_date - p.invoice.due_date).days
            
            if client_id not in clients_analytics:
                clients_analytics[client_id] = {'name': client_name, 'delays': [], 'total_paid': 0}
            
            clients_analytics[client_id]['delays'].append(delay)
            # Note: total_paid is simplistic here, aggregating per payment object
        
        customer_ratings = []
        for cid, data in clients_analytics.items():
            avg_delay = sum(data['delays']) / len(data['delays'])
            
            # Rating Logic
            if avg_delay <= 3:
                rating = 'A'
                desc = 'Həmişə vaxtında'
                color = 'text-green-600 bg-green-50'
            elif avg_delay <= 10:
                rating = 'B'
                desc = 'Adətən vaxtında'
                color = 'text-blue-600 bg-blue-50'
            elif avg_delay <= 20:
                rating = 'C'
                desc = 'Bəzən gecikir'
                color = 'text-orange-600 bg-orange-50'
            else:
                rating = 'D'
                desc = 'Tez-tez gecikir'
                color = 'text-red-600 bg-red-50'
                
            customer_ratings.append({
                'id': cid,
                'name': data['name'],
                'avg_delay': round(avg_delay, 1),
                'rating': rating,
                'description': desc,
                'color': color
            })
            
        # Sort customers by rating (A to D)
        customer_ratings.sort(key=lambda x: x['avg_delay'])

        response_data = {
            'behavior': {
                'on_time_pct': round(on_time_percentage, 1),
                'late_pct': round(late_percentage, 1),
                'avg_overdue_days': round(avg_overdue_days, 1)
            },
            'heatmap': formatted_heatmap,
            'methods': formatted_methods,
            'speed': formatted_speed,
            'customer_ratings': customer_ratings[:10] # Top 10
        }

        return Response(response_data)

class ProblematicInvoicesView(AnalyticsBaseView):
    def get(self, request):
        business = self.get_business(request)

        today = timezone.now().date()
        
        # Base QS: All unpaid invoices that are past due date
        overdue_invoices = Invoice.objects.filter(
            business=business, 
            due_date__lt=today
        ).exclude(status__in=['draft', 'paid', 'cancelled'])

        # 1. KPI Cards
        total_overdue_amount = sum(inv.total - inv.paid_amount for inv in overdue_invoices)
        debtors_count = overdue_invoices.values('client').distinct().count()
        
        # Critical Debt (>90 days)
        critical_date = today - timedelta(days=90)
        critical_invoices = overdue_invoices.filter(due_date__lt=critical_date)
        critical_debt = sum(inv.total - inv.paid_amount for inv in critical_invoices)

        # 2. Aging Analysis (Buckets)
        aging = {
            '1-30 gün': 0,
            '31-60 gün': 0,
            '61-90 gün': 0,
            '90+ gün': 0
        }

        for inv in overdue_invoices:
            overdue_days = (today - inv.due_date).days
            remaining = float(inv.total - inv.paid_amount)
            
            if overdue_days <= 30:
                aging['1-30 gün'] += remaining
            elif overdue_days <= 60:
                aging['31-60 gün'] += remaining
            elif overdue_days <= 90:
                aging['61-90 gün'] += remaining
            else:
                aging['90+ gün'] += remaining

        formatted_aging = [
            {'range': k, 'amount': v} for k, v in aging.items()
        ]

        # 3. Debtors List (Top Risk)
        debtors_map = {}
        for inv in overdue_invoices:
            cid = inv.client.id
            if cid not in debtors_map:
                debtors_map[cid] = {
                    'id': cid,
                    'name': inv.client.name,
                    'email': inv.client.email,
                    'phone': inv.client.phone,
                    'total_debt': 0,
                    'invoices_count': 0,
                    'max_overdue_days': 0
                }
            
            remaining = float(inv.total - inv.paid_amount)
            overdue_days = (today - inv.due_date).days
            
            debtors_map[cid]['total_debt'] += remaining
            debtors_map[cid]['invoices_count'] += 1
            if overdue_days > debtors_map[cid]['max_overdue_days']:
                debtors_map[cid]['max_overdue_days'] = overdue_days

        debtors_list = list(debtors_map.values())
        debtors_list.sort(key=lambda x: x['total_debt'], reverse=True)

        response_data = {
            'kpi': {
                'total_overdue': float(total_overdue_amount),
                'critical_debt': float(critical_debt),
                'debtors_count': debtors_count
            },
            'aging': formatted_aging,
            'debtors': debtors_list
        }

        return Response(response_data)

class ForecastAnalyticsView(AnalyticsBaseView):
    def get(self, request):
        business = self.get_business(request)

        today = timezone.now().date()
        current_month_start = today.replace(day=1)
        
        # --- 1. GROWTH METRICS (MoM, YoY) ---
        
        # Helper to get revenue for a specific month range
        def get_revenue(start_date, end_date):
            return Invoice.objects.filter(
                business=business, 
                invoice_date__range=[start_date, end_date],
                status__in=['paid', 'sent', 'overdue'] # Considering accrued revenue
            ).aggregate(total=Sum('total'))['total'] or 0

        # Current Month
        # End of current month
        next_month = (current_month_start + timedelta(days=32)).replace(day=1)
        current_month_end = next_month - timedelta(days=1)
        current_revenue = get_revenue(current_month_start, current_month_end)

        # Last Month
        last_month_end = current_month_start - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)
        last_revenue = get_revenue(last_month_start, last_month_end)

        # Same Month Last Year
        last_year_start = current_month_start.replace(year=today.year - 1)
        # Handle leap year edge case if needed, but replace handles most
        next_month_ly = (last_year_start + timedelta(days=32)).replace(day=1)
        last_year_end = next_month_ly - timedelta(days=1)
        last_year_revenue = get_revenue(last_year_start, last_year_end)

        # Calculations
        mom_growth = ((current_revenue - last_revenue) / last_revenue * 100) if last_revenue > 0 else 100 if current_revenue > 0 else 0
        yoy_growth = ((current_revenue - last_year_revenue) / last_year_revenue * 100) if last_year_revenue > 0 else 100 if current_revenue > 0 else 0

        # --- 2. REVENUE FORECAST (Linear Regression) ---
        
        # Get last 12 months data
        # We need a list of (month_index, revenue)
        historical_data = []
        months_labels = []
        
        # Loop back 11 months + current
        for i in range(11, -1, -1):
            # Calculate date range for Month (Current - i)
            # This is a bit tricky with time deltas, easier to construct date objects
            # Let's simple approximate for MVP or use relativedelta if available (not standard)
            # Using simple math logic:
            year = today.year
            month = today.month - i
            while month <= 0:
                month += 12
                year -= 1
            
            start = timezone.datetime(year, month, 1).date()
            # Get end of month
            if month == 12:
                end = timezone.datetime(year + 1, 1, 1).date() - timedelta(days=1)
            else:
                end = timezone.datetime(year, month + 1, 1).date() - timedelta(days=1)
            
            rev = get_revenue(start, end)
            historical_data.append(float(rev))
            months_labels.append(start.strftime("%b"))

        # Simple Linear Regression (Least Squares)
        n = len(historical_data)
        x = list(range(n)) # 0 to 11
        y = historical_data
        
        if n > 1 and sum(y) > 0:
            sum_x = sum(x)
            sum_y = sum(y)
            sum_xy = sum(xi*yi for xi, yi in zip(x, y))
            sum_xx = sum(xi**2 for xi in x)
            
            slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x**2) if (n * sum_xx - sum_x**2) != 0 else 0
            intercept = (sum_y - slope * sum_x) / n
        else:
            slope = 0
            intercept = 0 if n == 0 else y[0]

        # Forecast next 3 months
        forecast_data = []
        for i in range(1, 4):
            next_x = n - 1 + i
            predicted = slope * next_x + intercept
            
            # Scenarios
            realistic = max(0, predicted)
            best = realistic * 1.15 # 15% better
            worst = realistic * 0.85 # 15% worse
            
            # Future Date Label
            future_month = today.month + i
            future_year = today.year
            while future_month > 12:
                future_month -= 12
                future_year += 1
            label = timezone.datetime(future_year, future_month, 1).strftime("%b")
            
            forecast_data.append({
                'month': label,
                'realistic': round(realistic, 2),
                'best': round(best, 2),
                'worst': round(worst, 2),
                'is_projected': True
            })

        # Combine History with Forecast structure for chart
        combined_chart_data = []
        for idx, val in enumerate(historical_data):
            combined_chart_data.append({
                'month': months_labels[idx],
                'revenue': val,
                'is_projected': False
            })
        
        # --- 3. CASHFLOW FORECAST (Net Cashflow) ---
        
        # 1. Projected Inflow: Invoices due in next 3 months
        # 2. Projected Outflow: Avg Expenses of last 6 months * 3
        
        from .models import Expense # Import locally to avoid circular if any
        
        # Expense Avg
        six_months_ago = today - timedelta(days=180)
        expenses_last_6m = Expense.objects.filter(business=business, date__gt=six_months_ago).aggregate(total=Sum('amount'))['total'] or 0
        monthly_avg_expense = float(expenses_last_6m) / 6 if expenses_last_6m > 0 else 0
        
        cashflow_forecast = []
        for i in range(1, 4):
            # Month Range
            future_month = today.month + i
            future_year = today.year
            while future_month > 12:
                future_month -= 12
                future_year += 1
            
            start = timezone.datetime(future_year, future_month, 1).date()
            if future_month == 12:
                end = timezone.datetime(future_year + 1, 1, 1).date() - timedelta(days=1)
            else:
                end = timezone.datetime(future_year, future_month + 1, 1).date() - timedelta(days=1)
                
            # Inflow: Sum of Unpaid Invoices falling due in this month
            inflow = Invoice.objects.filter(
                business=business, 
                due_date__range=[start, end],
                status__in=['sent', 'viewed', 'overdue']
            ).aggregate(total=Sum('total'))['total'] or 0
            
            # Add accrued paid invoices? No, cashflow forecast represents FUTURE cash movement.
            # Paid invoices are already "Cash In". We want "To be collected".
            
            inflow = float(inflow)
            outflow = monthly_avg_expense # Assumed constant 
            net = inflow - outflow
            
            cashflow_forecast.append({
                'month': start.strftime("%b"),
                'inflow': round(inflow, 2),
                'outflow': round(outflow, 2),
                'net': round(net, 2)
            })

        # --- 4. RISK ANALYSIS (Churn) ---
        # Clients active before but NO invoices in last 90 days
        cutoff_date = today - timedelta(days=90)
        
        # Get all clients
        all_clients = business.clients.all()
        churn_risk_clients = []
        
        for client in all_clients:
            last_inv = client.invoices.order_by('-invoice_date').first()
            if last_inv:
                if last_inv.invoice_date < cutoff_date:
                    churn_risk_clients.append({
                        'id': client.id,
                        'name': client.name,
                        'last_seen': last_inv.invoice_date.strftime("%Y-%m-%d"),
                        'days_inactive': (today - last_inv.invoice_date).days
                    })
        
        # Sort by days inactive
        churn_risk_clients.sort(key=lambda x: x['days_inactive'], reverse=True)

        response_data = {
            'growth': {
                'mom': round(mom_growth, 1),
                'yoy': round(yoy_growth, 1),
                'cagr': 0 # TODO: Needs mult-year data logic, skip for now
            },
            'revenue_chart': combined_chart_data + forecast_data,
            'cashflow': cashflow_forecast,
            'risks': {
                'churn_list': churn_risk_clients[:5] # Top 5 at risk
            }
        }

        return Response(response_data)

class TaxAnalyticsView(AnalyticsBaseView):
    def get(self, request):
        business = self.get_business(request)

        # Fix Bug 12: Year validation
        try:
            year_str = request.query_params.get('year')
            year = int(year_str) if year_str else timezone.now().year
        except (ValueError, TypeError):
            year = timezone.now().year
        
        # Base Querysets for the specific year
        invoices = Invoice.objects.filter(business=business, invoice_date__year=year)
        # We consider paid/sent invoices for tax, excluding drafts and cancelled
        relevant_invoices = invoices.exclude(status__in=['draft', 'cancelled'])
        
        from .models import Expense
        expenses = Expense.objects.filter(business=business, date__year=year)

        # 1. VAT (ƏDV) Analysis
        vat_summary = relevant_invoices.aggregate(
            total_vat=Sum('tax_amount'),
            vat_18=Sum(Case(When(tax_rate=18, then=F('tax_amount')), output_field=IntegerField())),
            vat_0=Sum(Case(When(tax_rate=0, then=F('tax_amount')), output_field=IntegerField()))
        )

        # Monthly VAT Breakdown
        from django.db.models.functions import ExtractMonth
        monthly_vat = relevant_invoices.annotate(month=ExtractMonth('invoice_date'))\
            .values('month')\
            .annotate(vat=Sum('tax_amount'), revenue=Sum('total'))\
            .order_by('month')

        formatted_monthly = []
        month_names = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr']
        for m in monthly_vat:
            formatted_monthly.append({
                'month': month_names[m['month']-1],
                'vat': float(m['vat'] or 0),
                'revenue': float(m['revenue'] or 0)
            })

        # 2. Income Tax (Gəlir Vergisi)
        total_revenue = float(relevant_invoices.aggregate(Sum('total'))['total__sum'] or 0)
        total_expenses = float(expenses.aggregate(Sum('amount'))['amount__sum'] or 0)
        tax_base = max(0, total_revenue - total_expenses)
        
        # 3. Quarterly Breakdown
        from django.db.models.functions import ExtractQuarter
        quarterly_data = relevant_invoices.annotate(quarter=ExtractQuarter('invoice_date'))\
            .values('quarter')\
            .annotate(revenue=Sum('total'), vat=Sum('tax_amount'))\
            .order_by('quarter')
        
        quarterly_expenses = expenses.annotate(quarter=ExtractQuarter('date'))\
            .values('quarter')\
            .annotate(amount=Sum('amount'))\
            .order_by('quarter')
        
        exp_map = {q['quarter']: float(q['amount']) for q in quarterly_expenses}
        
        formatted_quarters = []
        for i in range(1, 5):
            q_rev = next((float(q['revenue']) for q in quarterly_data if q['quarter'] == i), 0)
            q_vat = next((float(q['vat']) for q in quarterly_data if q['quarter'] == i), 0)
            q_exp = exp_map.get(i, 0)
            
            formatted_quarters.append({
                'name': f'Q{i}',
                'revenue': q_rev,
                'vat': q_vat,
                'expenses': q_exp,
                'profit': q_rev - q_exp
            })

        # 4. Yearly Summary & Comparisons
        customer_count = relevant_invoices.values('client').distinct().count()
        
        response_data = {
            'year': year,
            'vat': {
                'total': float(vat_summary['total_vat'] or 0),
                'by_rate': {
                    'rate_18': float(vat_summary['vat_18'] or 0),
                    'rate_0': float(vat_summary['vat_0'] or 0)
                },
                'monthly': formatted_monthly
            },
            'income_tax': {
                'revenue': total_revenue,
                'expenses': total_expenses,
                'tax_base': tax_base,
                'estimates': {
                    'simplified_2pct': round(total_revenue * 0.02, 2),
                    'profit_20pct': round(tax_base * 0.20, 2),
                    'micro_5pct': round(tax_base * 0.05, 2)
                }
            },
            'quarterly': formatted_quarters,
            'summary': {
                'customer_count': customer_count,
                'best_month': max(formatted_monthly, key=lambda x: x['revenue'])['month'] if formatted_monthly else None
            }
        }

        return Response(response_data)
