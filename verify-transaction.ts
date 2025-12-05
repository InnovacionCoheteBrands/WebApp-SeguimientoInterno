
import 'dotenv/config';

async function testCreateTransaction() {
    try {
        const response = await fetch('http://localhost:5000/api/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: "Gasto",
                category: "Operativo",
                amount: "150.00", // String, no number - numeric fields in Drizzle map to strings
                date: new Date().toISOString(),
                description: "Test Transaction via Script",
                isPaid: true,
                paidDate: new Date().toISOString()
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ Transaction created successfully:', JSON.stringify(data, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating transaction:', error);
        process.exit(1);
    }
}

testCreateTransaction();
