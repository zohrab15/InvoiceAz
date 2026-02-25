// Native fetch in Node 24

async function run() {
    try {
        const res = await fetch('https://invoiceaz-staging.onrender.com/api/auth/registration/', {
            method: 'POST',
            body: JSON.stringify({
                email: 'demo_test_234@invoice.az',
                first_name: 'Test',
                last_name: 'Test',
                password1: 'TestPass123!',
                password2: 'TestPass123!'
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const text = await res.text();
        console.log('STATUS:', res.status);
        console.log('BODY:', text);
    } catch (e) {
        console.error(e);
    }
}
run();
