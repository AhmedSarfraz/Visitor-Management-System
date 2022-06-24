import React from 'react';
import { NavItem, Nav } from 'reactstrap';
import { useLocation, Link } from "react-router-dom";
import './Sidebar.css'

function Sidebar() {
    const location = useLocation();
    return (
        <div className="vms-sidebar">
            <Nav vertical>
                <NavItem className={location.pathname==="/admin" ? "active" : ""}>
                    <Link className="nav-link" to="/admin"><i className="fa fa-line-chart" aria-hidden="true"></i><label>&nbsp;&nbsp;&nbsp;Overview</label></Link>
                </NavItem>
                <NavItem className={location.pathname==="/admin/tickets" ? "active" : ""}>
                    <Link className="nav-link" to="/admin/tickets"><i className="fa fa-users" aria-hidden="true"></i><label>&nbsp;&nbsp;&nbsp;All Tickets</label></Link>
                </NavItem>
                <NavItem className={location.pathname==="/admin/agents" ? "active" : ""}>
                    <Link className="nav-link" to="/admin/agents"><i className="fa fa-user-circle" aria-hidden="true"></i><label>&nbsp;&nbsp;&nbsp;All Agents</label></Link>
                </NavItem>
                <NavItem className={location.pathname==="/admin/languages" ? "active" : ""}>
                    <Link className="nav-link" to="/admin/languages"><i className="fa fa-user-circle" aria-hidden="true"></i><label>&nbsp;&nbsp;&nbsp;All Languages</label></Link>
                </NavItem>
                <NavItem className={location.pathname==="/admin/locations" ? "active" : ""}>
                    <Link className="nav-link" to="/admin/locations"><i className="fa fa-map-marker" aria-hidden="true"></i><label>&nbsp;&nbsp;&nbsp;Locations</label></Link>
                </NavItem>
                <NavItem className={location.pathname==="/admin/reasons" ? "active" : ""}>
                    <Link className="nav-link" to="/admin/reasons"><i className="fa fa-building-o" aria-hidden="true"></i><label>&nbsp;&nbsp;&nbsp;Reasons</label></Link>
                </NavItem>
                <NavItem className={location.pathname==="/admin/settings" ? "active" : ""}>
                    <Link className="nav-link" to="/admin/settings"><i className="fa fa-cog" aria-hidden="true"></i><label>&nbsp;&nbsp;&nbsp;Settings</label></Link>
                </NavItem>
            </Nav>
        </div>
    )
}

export default Sidebar
