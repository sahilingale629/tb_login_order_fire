import React, { useState } from 'react';
import axios from 'axios';

const LoginFlow = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [logintoken, setLogintoken] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const apiBaseURL = 'https://uat-api-algo.tradebulls.in';
    const headers = {
        'request-info': '{"rit":"123","cver": "1.0v","ch": "WEB","info":{}}}',
        'x-api-key': process.env.REACT_APP_API_KEY,
    };

    const handleLogin = async () => {
        setLoading(true);
        setError('');
        console.log('Sending login request with username:', username);
        try {
            const response = await axios.post(
                '/api/ms-algo-trading-authservice/login',
                {
                    username,
                    password,
                    clientId: 'tbsenterpriseweb',
                    appId: '1',
                    vendorName: '<vendor_name>',
                    state: '<state>',
                },
                { headers }
            );
            console.log('Login response:', response.data);
            const token = response.data?.data?.success?.logintoken;
            setLogintoken(token);
        } catch (error) {
            console.error('Login request failed:', error);
            setError('Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async () => {
        setLoading(true);
        setError('');
        console.log('Sending OTP request with logintoken:', logintoken);
        try {
            await axios.post(
                '/api/ms-algo-trading-authservice/sendOtp',
                { payload: [{ logintoken, product: 'OTP2FA' }] },
                { headers }
            );
            console.log('OTP sent successfully');
        } catch (error) {
            console.error('Failed to send OTP:', error);
            setError('Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin2FA = async () => {
        setLoading(true);
        setError('');
        console.log('Sending 2FA login request with OTP:', otp);
        try {
            const response = await axios.post(
                '/api/ms-algo-trading-authservice/login2faTotp',
                {
                    payload: [{ logintoken, otp, authFlag: '0' }],
                },
                { headers }
            );
            console.log('2FA Login response:', response.data);
            const token = response.data?.data?.success?.access_token;
            setAccessToken(token);
        } catch (error) {
            console.error('2FA Login request failed:', error);
            setError('2FA Login failed. Please check the OTP and try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchProfile = async () => {
        setLoading(true);
        setError('');
        console.log('Fetching profile with access token:', accessToken);
        try {
            const response = await axios.get(
                '/api/ms-trading-customer-profile/loggedinuser/profiledetails',
                {
                    headers: {
                        ...headers,
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            console.log('Profile Data:', response.data);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            setError('Failed to fetch profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Login Flow</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {loading && <p>Loading...</p>}

            {!logintoken && (
                <div>
                    <h2>Step 1: Login</h2>
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
                    <button onClick={handleLogin} disabled={loading}>
                        Login
                    </button>
                </div>
            )}

            {logintoken && !accessToken && (
                <div>
                    <h2>Step 2: Verify OTP</h2>
                    <button onClick={handleSendOtp} disabled={loading}>
                        Send OTP
                    </button>
                    <input
                        type="text"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                    />
                    <button onClick={handleLogin2FA} disabled={loading}>
                        Login 2FA
                    </button>
                </div>
            )}

            {accessToken && (
                <div>
                    <h2>Step 3: Fetch Profile</h2>
                    <button onClick={fetchProfile} disabled={loading}>
                        Get Profile
                    </button>
                </div>
            )}
        </div>
    );
};

export default LoginFlow;
