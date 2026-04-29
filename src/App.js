import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Menu from './pages/Menu';
import DocChat from './pages/DocChat';
import Debug from './pages/Debug';
import Topology from './pages/Topology';
import MachineMemory from './pages/MachineMemory';
import Report from './pages/Report';
import { useAppContext } from './context/AppContext';
const ProtectedRoute = ({ children }) => {
    const { user } = useAppContext();
    return user ? children : _jsx(Navigate, { to: "/login", replace: true });
};
export default function App() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsxs(Route, { path: "/", element: _jsx(ProtectedRoute, { children: _jsx(Layout, {}) }), children: [_jsx(Route, { index: true, element: _jsx(Navigate, { to: "dashboard", replace: true }) }), _jsx(Route, { path: "dashboard", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "menu", element: _jsx(Menu, {}) }), _jsx(Route, { path: "docchat", element: _jsx(DocChat, {}) }), _jsx(Route, { path: "debug", element: _jsx(Debug, {}) }), _jsx(Route, { path: "topology", element: _jsx(Topology, {}) }), _jsx(Route, { path: "memory/:machineId", element: _jsx(MachineMemory, {}) }), _jsx(Route, { path: "report", element: _jsx(Report, {}) })] }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }));
}
