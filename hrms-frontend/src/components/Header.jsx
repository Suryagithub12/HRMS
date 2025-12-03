import React from 'react';
import useAuthStore from '../stores/authstore';
import api from '../api/axios';
import { Link, useNavigate } from 'react-router-dom';

export default function Header() {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const loading = useAuthStore(s => s.loading);
  const navigate = useNavigate();

  const handleLogout = async () => {
    const refresh = localStorage.getItem('hrms_refresh');
    try { await api.post('/auth/logout', { refreshToken: refresh }); } catch (e) {}
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <div className="font-bold">HRMS</div>
        <nav>Loading...</nav>
      </header>
    );
  }

  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <div><Link to="/" className="font-bold">HRMS</Link></div>

      <nav className="flex gap-4 items-center">
        <Link to="/">Dashboard</Link>

        {user?.role === 'ADMIN' && (
          <>
            <Link to="/employees">Employees</Link>
            <Link to="/departments">Departments</Link>
            <Link to="/payroll">Payroll</Link>
            <Link to="/leaves">All Leaves</Link>
            <Link to="/attendance">All Attendance</Link>
            <span className="px-2 py-1 bg-gray-100 rounded text-sm">Admin</span>
          </>
        )}

        {user?.role === 'AGILITY_EMPLOYEE' && (
          <>
            <Link to="/attendance">My Attendance</Link>
            <Link to="/leaves">My Leaves</Link>
            <Link to="/payroll">My Payroll</Link>
            <span className="px-2 py-1 bg-green-100 rounded text-sm">Agility</span>
          </>
        )}

        {user?.role === 'LYF_EMPLOYEE' && (
          <>
            <Link to="/attendance">My Attendance</Link>
            <Link to="/leaves">My Leaves</Link>
            <Link to="/payroll">My Payroll</Link>
            <span className="px-2 py-1 bg-indigo-100 rounded text-sm">Lyfshilp</span>
          </>
        )}

        {user ? (
          <div className="flex items-center gap-3">
            <span>{user.firstName}</span>
            <button onClick={handleLogout} className="text-sm bg-red-500 text-white px-3 py-1 rounded">Logout</button>
          </div>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </nav>
    </header>
  );
}
 