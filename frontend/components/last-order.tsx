'use client';

import { useState, useEffect } from 'react';

interface OrderItem {
    product_id: string;
    quantity: number;
}

interface Order {
    id: string;
    items: OrderItem[];
    total: number;
    currency: string;
    created_at: string;
}

export function LastOrder() {
    const [lastOrder, setLastOrder] = useState<Order | null>(null);

    const fetchLastOrder = async () => {
        try {
            const res = await fetch("http://localhost:8000/last-order");
            if (res.ok) {
                const data = await res.json();
                // Check if data is empty object
                if (Object.keys(data).length > 0) {
                    setLastOrder(data);
                }
            }
        } catch (error) {
            console.error("Failed to fetch last order:", error);
        }
    };

    useEffect(() => {
        fetchLastOrder();
        const interval = setInterval(fetchLastOrder, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-4 border rounded-lg bg-white/5 backdrop-blur-sm h-full overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-white">Last Order</h2>

            {!lastOrder && <p className="text-gray-400">No orders yet.</p>}

            {lastOrder && (
                <div className="space-y-2 text-gray-200">
                    <p><span className="font-bold text-gray-400">Order ID:</span> {lastOrder.id}</p>
                    <p><span className="font-bold text-gray-400">Total:</span> {lastOrder.total} {lastOrder.currency}</p>
                    <div>
                        <p className="font-bold text-gray-400 mb-1">Items:</p>
                        <ul className="list-disc list-inside pl-2">
                            {lastOrder.items.map((item, i) => (
                                <li key={i}>
                                    {item.product_id} × {item.quantity}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
