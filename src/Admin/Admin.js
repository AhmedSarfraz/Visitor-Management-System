import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom';
import { BrowserRouter as Switch, Route } from "react-router-dom";
import { Nav, Navbar, NavbarText, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, Badge, Row, Col, Input, Label, InputGroup, InputGroupAddon, InputGroupText, Button } from 'reactstrap';
import { updateDoc, doc, collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db, addPrefix } from '../firebase';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Tickets from './Tickets';
import Agents from './Agents';
import Languages from './Languages';
import Locations from './Locations';
import Departments from './Departments';
import Settings from './Settings';
import driverPlaceholder from '../assets/placeholder.png'
import DateRangePickerModal from './DateRangePickerModal';
import moment from 'moment';
import './Admin.css'

function Admin({ currentUser, handleLogout, allAgents, activeDrivers, allLocations, allLanguages, allDepartments, loadLocations, loadLanguages, loadDepartments }) {
  const [activePath, setActivePath] = useState("")
  const [allTickets, setAllTickets] = useState([])
  const [error, setError] = useState("")
  const [filteredDrivers, setFilteredDrivers] = useState()
  const [filteredAgents, setFilteredAgents] = useState()
  const [openModal, setOpenModal] = useState("")
  const [filters, setFilters] = useState({
    selection: {
        startDate: moment().startOf('week'),
        endDate: moment().endOf('week'),
        key: 'selection',
    },
    agent: null, reason: null, status: null, searchTerm: null,
  })

  const handleLoginAsAgent = async () => {
    try {
      if (currentUser.pk) {
        await updateDoc(doc(db, addPrefix("users"), String(currentUser.pk)), {
          "status": "active",
          "isAgent": true,
        });
      }
      window.location.reload(false);
    } catch (err) {
      setError("Error: Unable to login as agent!")
    }
  }

  //To get all Tickets
  const loadTickets = async () => {
    let querySet = query(collection(db, addPrefix("tickets")));
    if (filters.selection.startDate) querySet = query(querySet, where("dateAdded", ">=", new Date(filters.selection.startDate)))
    if (filters.selection.endDate) {
      let currentDate = new Date(filters.selection.endDate)
      currentDate.setDate(currentDate.getDate() + 1)
      querySet = query(querySet, where("dateAdded", "<=", currentDate))
    }
    const querySnapshot = await getDocs(query(querySet, orderBy("dateAdded", "desc")))
    setAllTickets(querySnapshot.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id })))
  }

  useEffect(() => {
    loadTickets()
  }, [filters.selection])

  useEffect(() => {
    let drivers = allTickets
    let agents = allAgents

    if (filters && filters.agent) {
        agents = agents.filter(agent => agent.userPk == filters.agent)
        drivers = drivers.filter(driver => driver.agent == filters.agent)
    }
    if (filters && filters.reason) 
        drivers = drivers.filter(driver => driver.department == filters.reason)
    if (filters && filters.selection.startDate)
        drivers = drivers.filter(driver => moment(driver.dateAdded.toDate()).format(moment.HTML5_FMT.DATE) >= moment(filters.selection.startDate).format(moment.HTML5_FMT.DATE))
    if (filters && filters.selection.endDate)
        drivers = drivers.filter(driver => moment(driver.dateAdded.toDate()).format(moment.HTML5_FMT.DATE) <= moment(filters.selection.endDate).format(moment.HTML5_FMT.DATE))
    if (filters.status)
        drivers = drivers.filter(driver => driver.status == filters.status);
    if(filters.searchTerm) 
        drivers = drivers.filter(driver => (driver.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) || driver.phone.includes(filters.searchTerm) || driver.tlcLicense.includes(filters.searchTerm)))        
    
    setFilteredDrivers(drivers)
    setFilteredAgents(agents)
  }, [allTickets, allAgents, filters])
  // }, [activeDrivers])

  return (<>
    <Switch>
        <Navbar light expand="xs" className="vms-header">
            <Nav className="mr-auto" navbar>
                <UncontrolledDropdown nav inNavbar>
                    <DropdownToggle nav caret>
                        <span className={"vms-avatar " + (currentUser.status === "active" ? "border-green" : "")} style={{ width: "50px" }}>
                          <img src={driverPlaceholder} className="w-100" alt="" />
                        </span>&nbsp;&nbsp;&nbsp;&nbsp;{currentUser.username}
                    </DropdownToggle>
                    <DropdownMenu right>
                        {currentUser.groupNames && currentUser.groupNames.includes("VMS-Admin") && <DropdownItem onClick={() => handleLoginAsAgent()}><b>Switch To Agent</b></DropdownItem>}
                        <DropdownItem divider />
                        <DropdownItem onClick={() => handleLogout()}><b>Logout</b></DropdownItem>
                    </DropdownMenu>
                </UncontrolledDropdown>
                {error && <NavbarText style={{ marginLeft: '3rem' }}><Badge color="danger" className="p-3">{error}</Badge></NavbarText>}
            </Nav>
      </Navbar>
      <Row className="no-gutters vms-main-wrapper" style={{ background: "#E4E8F4" }}>
          <Col md={1} lg={1} xl={2}>
              <Sidebar />
          </Col>
          <Col md={11} lg={11} xl={10}>
              <div className="vms-admin-container">
                  {activePath && (activePath === "Dashboard" || activePath === "Tickets") && <Row className="vms-filters-wrapper vms-dashboard-filter-wrapper no-gutters">
                      <Col>
                          <DateRangePickerModal isOpen={openModal === "dateRangePicker"} handleClose={()=>setOpenModal()} filters={filters} setFilters={setFilters}/>
                          <Label>Filter By Date Range</Label>
                          <br/>                    
                          <Button style={{borderRadius: "0"}} onClick={() => setOpenModal("dateRangePicker")}>
                            {moment(filters.selection.startDate).format(moment.HTML5_FMT.DATE) === moment().startOf('week').format(moment.HTML5_FMT.DATE) && moment(filters.selection.endDate).format(moment.HTML5_FMT.DATE) === moment().endOf('week').format(moment.HTML5_FMT.DATE) ? 
                              "Current Week" : (filters.selection.startDate || filters.selection.endDate) ? 
                              ((filters.selection.startDate ? moment(filters.selection?.startDate).format(moment.HTML5_FMT.DATE) : "--") + " - " + (filters.selection.endDate ? moment(filters.selection?.endDate).format(moment.HTML5_FMT.DATE) : "--")) : "Click to Select Range"
                            }
                          </Button>
                          {/* &nbsp;&nbsp;&nbsp;&nbsp;{(filters.selection.startDate || filters.selection.endDate) && <Button style={{borderRadius: "0"}} color="primary" onClick={()=>setFilters({...filters,  selection: {startDate: null, endDate: null, key: 'selection'}})}>Clear Selection</Button>} */}
                      </Col>
                      <Col>
                        {activePath === "Tickets" && <>
                          <Label>Search</Label>
                          <InputGroup>
                              <Input type="text" value={filters.searchTerm} onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })} placeholder={"Filter by Phone, TLC"} />
                              <InputGroupAddon addonType="append">
                                  <InputGroupText><i className="fa fa-search" aria-hidden="true"></i></InputGroupText>
                              </InputGroupAddon>
                          </InputGroup>
                        </>}
                      </Col>
                      <Col>
                        {activePath === "Tickets" && <>
                          <Label>Filter By Status</Label>
                          <InputGroup>
                              <Input type="select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                                  <option value="">-- Filter by Status --</option>
                                  {["waiting", "assigned", "completed", "removed"]?.map(item => <option value={item}>{item}</option>)}
                              </Input>
                              <InputGroupAddon addonType="append">
                                  <InputGroupText><i className="fa fa-hourglass-start" aria-hidden="true"></i></InputGroupText>
                              </InputGroupAddon>
                          </InputGroup>
                        </>}
                      </Col>
                      <Col>
                          <Label>Filter By Visiting Reasons</Label>
                          <InputGroup>
                              <Input type="select" value={filters.reason} onChange={(e) => setFilters({ ...filters, reason: e.target.value })}>
                                  <option value="">-- All Reasons --</option>
                                  {allDepartments.map(reason => <option key={reason.firebaseId} value={reason.name}>{reason.name}</option>)}
                              </Input>
                              <InputGroupAddon addonType="append">
                                  <InputGroupText><i className="fa fa-building-o" aria-hidden="true"></i></InputGroupText>
                              </InputGroupAddon>
                          </InputGroup>
                      </Col>
                      <Col>
                          <Label>Filter By Agent</Label>
                          <InputGroup>
                              <Input type="select" value={filters.agent} onChange={(e) => setFilters({ ...filters, agent: e.target.value })}>
                                  <option value="">-- All Agents --</option>
                                  {allAgents.map(agent => <option key={agent.userId} value={agent.userPk}>{agent.username}</option>)}
                              </Input>
                              <InputGroupAddon addonType="append">
                                  <InputGroupText><i className="fa fa-user-o" aria-hidden="true"></i></InputGroupText>
                              </InputGroupAddon>
                          </InputGroup>  
                      </Col>
                  </Row>}
                  <Route exact path="/admin">
                    <Dashboard filteredAgents={filteredAgents} filteredDrivers={filteredDrivers} allLanguages={allLanguages} allDepartments={allDepartments} filters={filters} setActivePath={setActivePath} />
                  </Route>
                  <Route path="/admin/tickets">
                    <Tickets allAgents={allAgents} filteredTickets={filteredDrivers} filters={filters} setActivePath={setActivePath} currentUser={currentUser} refetchTickets={loadTickets} />
                  </Route>
                  <Route path="/admin/agents">
                    <Agents allAgents={allAgents} activeDrivers={activeDrivers} setActivePath={setActivePath} />
                  </Route>
                  <Route path="/admin/languages">
                    <Languages languages={allLanguages} loadLanguages={loadLanguages} setActivePath={setActivePath} />
                  </Route>
                  <Route path="/admin/locations">
                    <Locations locations={allLocations} loadLocations={loadLocations} setActivePath={setActivePath} />
                  </Route>
                  <Route path="/admin/reasons">
                    <Departments departments={allDepartments} loadDepartments={loadDepartments} setActivePath={setActivePath} />
                  </Route>
                  <Route path="/admin/settings">
                    <Settings />
                  </Route>
              </div>
          </Col>
      </Row>
    </Switch>
  </>)
}

export default Admin
