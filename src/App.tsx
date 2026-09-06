import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RequestIntake from "./pages/RequestIntake";
import RequestsList from "./pages/RequestsList";
import ScheduleViewer from "./pages/ScheduleViewer";
import WhatIf from "./pages/WhatIf";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/app" element={<Dashboard />} />
        <Route path="/app/requests" element={<RequestsList />} />
        <Route path="/app/requests/new" element={<RequestIntake />} />
        <Route path="/app/schedule" element={<ScheduleViewer />} />
        <Route path="/app/whatif" element={<WhatIf />} />
      </Route>
    </Routes>
  );
}
