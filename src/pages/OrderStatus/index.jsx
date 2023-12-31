/* eslint-disable react/prop-types */
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Layout } from "../../components/Layout";
import { Item } from "./Item";
import { ProductItem } from "./ProductItem";
import './order-status.css'
import { useEffect } from "react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCallback } from "react";
import { Pay } from "./Pay";
import { firebaseDB } from '../../utils/firebase';
import { getDoc, doc } from 'firebase/firestore/lite';

// mapping order status to readable text
const statusMapping = (status) => {
    switch(status) {
        case 'pending':
            return 'Menunggu Pembayaran';
        case 'settlement':
            return 'Pembayaran Berhasil';
        case 'canceled':
            return 'Pesanan Dibatalkan';
        default:
            return 'Menunggu Pembayaran';
    }
}

const OrderStatus = () => {
    const [transaction, setTransaction] = useState(null);
    const [searchTransactionId, setSearchTransactionId] = useState('');
    const [emptyMessage, setEmptyMessage] = useState('');
    const navigate = useNavigate();
    let [searchParams, setSearchParams] = useSearchParams();
    const [snapShow, setSnapShow] = useState(false);
    
    const getTransactionDetail = useCallback(async (transactionId) => {
        if(!transactionId) return alert('Transaction ID harus diisi');
        const transactionRef = doc(firebaseDB, "transactions", transactionId);
        var transactionSnapshot = null;
        try {
            transactionSnapshot = await getDoc(transactionRef);
        } catch ({ name, message }) {
            return alert(message)
        }

        const data = transactionSnapshot.data();
        
        if (data) {
            const products = data.products.map((item) => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            }));
            const transaction = {
                id: transactionId,
                customer_name: data.customer_name,
                customer_email: data.customer_email,
                products: products,
                total: data.total,
                transaction_timestamp: data.transaction_timestamp,
                payment_method: data.payment_method,
                status: data.status
            };
            setTransaction(transaction);
            setSearchParams({transaction_id: transactionId}, {replace: true});
            setEmptyMessage('');
        } else {
            setEmptyMessage('Transaksi tidak ditemukan');
            setTransaction(null);
            setSearchParams({}, {replace: true});
        }
    }, [setSearchParams])
    
    useEffect(() => {
        const transactionId = searchParams.get('transaction_id');
        if(transactionId) {
            getTransactionDetail(transactionId);
        } else {
            setEmptyMessage('Belum ada transaksi yang dicari, silahkan masukkan ID Transaksi');
        }
    }, [getTransactionDetail, searchParams]);

    return (
        <Layout title="Status Pesanan" onBack={() => navigate('/', {replace: true})} full={snapShow} noHeader={snapShow}>
            {!snapShow && (
                <>
                    <Input label="Kode Pesanan" value={searchTransactionId} onChange={(e) => setSearchTransactionId(e.target.value)} />
                    <Button onClick={() => getTransactionDetail(searchTransactionId)}>Cek Status Pesanan</Button>
                    <hr/>
                    {emptyMessage && <p className="empty-message">{emptyMessage}</p>}
                    {transaction && (
                        <>
                            <div className="transaction-status">
                                <Item label="ID Transaksi" value={transaction.id} />
                                <Item label="Tanggal Transaksi" value={new Date(transaction.transaction_timestamp).toLocaleString()} />
                                <Item label="Customer Name" value={transaction.customer_name} />
                                <Item label="Customer Email" value={transaction.customer_email} />
                                <Item label="Status" value={statusMapping(transaction.status)} />
                                {transaction.payment_method && (
                                    <Item label="Payment Method" value={transaction.payment_method} />
                                )}
                                {transaction.status === 'pending' && (
                                    <Pay transaction={transaction} onPayChange={(value) => setSnapShow(value)} />
                                )}
                            </div>
                            <div className="transaction-status">
                                {transaction.products.map((product) => (
                                    <ProductItem key={product.id} name={product.name} price={product.price} totalItem={product.quantity} />
                                ))}
                                <ProductItem name="Total" price={transaction.total} />
                            </div>
                        </>
                    )}
                </>
            )}
            <div id="snap-container"></div>
        </Layout>
    );
};

export default OrderStatus;
