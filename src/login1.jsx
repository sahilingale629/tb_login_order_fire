import React, { useState } from 'react';
import axios from 'axios';

const LoginFlow = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [orderResponse, setOrderResponse] = useState(null);
    const [orderReport, setOrderReport] = useState(null);
    const [orderDetails, setOrderDetails] = useState({
        requestStatus: "New",
        ex: "NCM",
        seg: "EQ",
        disQty: 0,
        tPrice: "0.00",
        val: "GFD",
        goalId: "",
        orderId: "",
        valDate: 0,
        userId: "",
        productName: "",
        sId: '',
        dpAccNo: '',
        buySell: '',
        qty: '',
        price: '',
        type: '',
        pId: '',
        tk: '',
    });

    let decryptedAccessToken = null;

    const headers = {
        'request-info': '{"rit":"123","cver": "1.0v","ch": "WEB","info":{}}',
        'x-api-key': "E6J9HA1BA31EJK90IK12KL80BBRRN590",
        'Content-Type': 'application/json',
    };

    const secretKey = "id+qipZHEPff/jNJPlyjKObYKcM+JWqzYFGGGzJh+mc=";

    class TBSAlgoEncryptDecrypt {
        static ALGORITHM = "AES-GCM";
        static GCM_IV_LENGTH = 12;
        static GCM_TAG_LENGTH = 16;

        static async gcmDecrypt(encryptedData, secretKey) {
            try {
                // Fix base64 issues
                const fixedEncryptedData = this.fixBase64(encryptedData);
                const fixedSecretKey = this.fixBase64(secretKey);

                // Decode inputs
                const encryptedBuffer = Uint8Array.from(atob(fixedEncryptedData), (c) => c.charCodeAt(0));
                const keyBuffer = Uint8Array.from(atob(fixedSecretKey), (c) => c.charCodeAt(0));

                // Extract IV, ciphertext, and authentication tag
                const iv = encryptedBuffer.slice(0, this.GCM_IV_LENGTH);
                const ciphertext = encryptedBuffer.slice(
                    this.GCM_IV_LENGTH,
                    encryptedBuffer.length - this.GCM_TAG_LENGTH
                );
                const authTag = encryptedBuffer.slice(
                    encryptedBuffer.length - this.GCM_TAG_LENGTH
                );

                // Append the authentication tag to the ciphertext
                const combinedCiphertext = new Uint8Array(ciphertext.length + authTag.length);
                combinedCiphertext.set(ciphertext);
                combinedCiphertext.set(authTag, ciphertext.length);

                // Import the key
                const cryptoKey = await crypto.subtle.importKey(
                    "raw",
                    keyBuffer,
                    { name: this.ALGORITHM },
                    false,
                    ["decrypt"]
                );

                // Decrypt
                const decryptedBuffer = await crypto.subtle.decrypt(
                    {
                        name: this.ALGORITHM,
                        iv: iv,
                    },
                    cryptoKey,
                    combinedCiphertext
                );

                // Decode the decrypted data to a string
                return new TextDecoder().decode(decryptedBuffer);
            } catch (error) {
                console.error("Decryption failed:", error.message);
                throw error;
            }
        }

        static fixBase64(base64String) {
            // Replace URL-safe characters with standard Base64 characters
            let fixedBase64 = base64String.replace(/-/g, "+").replace(/_/g, "/");
            // Add padding if necessary
            while (fixedBase64.length % 4 !== 0) {
                fixedBase64 += "=";
            }
            return fixedBase64;
        }
    }

    // Example usage
    (async () => {
        try {
            const decryptedData = await TBSAlgoEncryptDecrypt.gcmDecrypt(
                "pMsEDoWTLDmDCk1SpWT913pz4n22pykeXXhlRvLqkO-5gBVzZFRxo5ZQ8pqkpRrqO4iadfP5ZCGgNUBPt0DZzA==",
                "id+qipZHEPff/jNJPlyjKObYKcM+JWqzYFGGGzJh+mc="
            );
            console.log("Decrypted Data:", decryptedData);
            decryptedAccessToken = decryptedData;
        } catch (err) {
            console.error("Error:", err.message);
        }
    })();

    const automateLoginFlow = async () => {
        setLoading(true);
        setError('');
        console.log('Initiating login flow...');
        try {
            console.log('Sending login request...');
            const loginResponse = await axios.post(
                '/ms-algo-trading-authservice/login',
                {
                    username,
                    password,
                    clientId: 'tbsenterpriseweb',
                    appId: '1',
                    vendorName: 'MintMaster',
                    state: 'MINT',
                },
                { headers }
            );
            console.log('Login response:', loginResponse.data);

            const logintoken = loginResponse.data?.data?.success?.logintoken;
            if (!logintoken) throw new Error('Login token not received.');
            console.log('Login token:', logintoken);

            console.log('Sending 2FA request...');
            const login2FAResponse = await axios.post(
                '/ms-algo-trading-authservice/login2faTotp',
                {
                    payload: [{ logintoken, otp: '123456', authFlag: '0' }],
                },
                { headers }
            );
            console.log('2FA response:', login2FAResponse.data);

            const encryptedAccessToken = login2FAResponse.data?.data?.success?.access_token;
            if (!encryptedAccessToken) throw new Error('Access token not received.');
            console.log('Encrypted access token:', encryptedAccessToken);

            decryptedAccessToken = await TBSAlgoEncryptDecrypt.gcmDecrypt(
                encryptedAccessToken,
                secretKey
            );

            setProfileData({ message: 'Login successful' });
            console.log('Login successful, decrypted access token:', decryptedAccessToken);
        } catch (err) {
            console.error('Error during login flow:', err);
            setError('Failed to complete login flow. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setOrderDetails((prev) => {
            const updatedDetails = { ...prev, [name]: value };
            console.log('Order details updated:', updatedDetails);
            return updatedDetails;
        });
    };

    const fetchOrderReport = async () => {
        try {
            console.log('Fetching order report...');
            setLoading(true);
            setError('');
            const reportResponse = await axios.get(
                'https://uat-api-algo.tradebulls.in/ms-order-report/order/ps',
                {
                    headers: {
                        ...headers,
                        Authorization: `Bearer ${decryptedAccessToken}`,
                    },
                }
            );
            console.log('Order report response:', reportResponse.data);
            setOrderReport(reportResponse.data.data?.success);
        } catch (err) {
            console.error('Error fetching order report:', err);
            setError('Failed to fetch order report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fireOrder = async () => {
        try {
            console.log('Firing order...');
            setLoading(true);
            setError('');

            const orderPayload = {
                payload: [orderDetails],
            };
            console.log('Order payload:', orderPayload);  // Log the payload

            const orderHeaders = {
                ...headers,
                Authorization: `Bearer ${decryptedAccessToken}`,
            };
            console.log('Order headers:', orderHeaders);  // Log the headers

            const orderResponse = await axios.post(
                'https://uat-api-algo.tradebulls.in/ms-order-placement/push',
                orderPayload,
                {
                    headers: orderHeaders,
                }
            );

            console.log('Order response:', orderResponse.data);
            setOrderResponse(orderResponse.data);
            alert('Order placed successfully!');
        } catch (err) {
            console.error('Error firing order:', err);
            setError('Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Login Flow</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {loading && <p>Loading...</p>}

            {!profileData ? (
                <div>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button onClick={automateLoginFlow} disabled={loading}>
                        Start Login Flow
                    </button>
                </div>
            ) : (
                <div>
                    <h2>{profileData.message}</h2>
                    <div>
                        <input
                            type="text"
                            name="sId"
                            placeholder="sId"
                            value={orderDetails.sId}
                            onChange={handleInputChange}
                        />
                        <input
                            type="text"
                            name="tk"
                            placeholder="tk"
                            value={orderDetails.tk}
                            onChange={handleInputChange}
                        />
                        <input
                            type="text"
                            name="dpAccNo"
                            placeholder="dpAccNo"
                            value={orderDetails.dpAccNo}
                            onChange={handleInputChange}
                        />
                        <input
                            type="text"
                            name="buySell"
                            placeholder="buySell"
                            value={orderDetails.buySell}
                            onChange={handleInputChange}
                        />
                        <input
                            type="number"
                            name="qty"
                            placeholder="Quantity"
                            value={orderDetails.qty}
                            onChange={handleInputChange}
                        />
                        <input
                            type="number"
                            name="price"
                            placeholder="Price"
                            value={orderDetails.price}
                            onChange={handleInputChange}
                        />
                        <input
                            type="text"
                            name="type"
                            placeholder="Type"
                            value={orderDetails.type}
                            onChange={handleInputChange}
                        />
                        <input
                            type="text"
                            name="pId"
                            placeholder="pId"
                            value={orderDetails.pId}
                            onChange={handleInputChange}
                        />
                        <button type="button" onClick={fireOrder}>
                            Fire Order
                        </button>
                        <button type="button" onClick={fetchOrderReport}>
                            Order Report
                        </button>
                    </div>
                </div>
            )}

            {orderResponse && (
                <div>
                    <h2>Order Response</h2>
                    <pre>{JSON.stringify(orderResponse, null, 2)}</pre>
                </div>
            )}

            {orderReport && (
                <div>
                    <h2>Order Report</h2>
                    <pre>{JSON.stringify(orderReport, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default LoginFlow;
