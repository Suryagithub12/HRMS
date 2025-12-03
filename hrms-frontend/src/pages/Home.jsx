// import React, { useState, useContext } from 'react';
// import { AuthContext } from '../contexts/AuthContext';
// import { useNavigate } from 'react-router-dom';

// export default function Login() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const { login } = useContext(AuthContext);
//   const navigate = useNavigate();

//   const onSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       await login(email, password);
//       navigate('/dashboard');
//     } catch (err) {
//       alert(err.response?.data?.message || 'Login failed');
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-white">
//       <form onSubmit={onSubmit} className="w-full max-w-md p-6 rounded-xl shadow-sm">
//         <h1 className="text-2xl font-semibold text-secondary mb-4">Sign in</h1>
//         <input required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full mb-3 input" />
//         <input required type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full mb-3 input" />
//         <button className="w-full py-2 rounded-xl bg-primary text-white">Login</button>
//       </form>
//     </div>
//   );
// }
