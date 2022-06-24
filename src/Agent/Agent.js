import { useState } from 'react'
import { Nav, Navbar, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { updateDoc, doc } from "firebase/firestore";
import driverPlaceholder from '../assets/agent.png'
import { db, addPrefix } from '../firebase';
import ErrorModal from '../Components/ErrorModal';
import QueueContainer from './QueueContainer';
import './Agent.css'

function Agent({ currentUser, handleLogout, setCurrentUser, languages, locations, activeDrivers, allAgents }) {
  const allLocations = locations.filter(location => location.status == "active")
  const allLanguages = languages.filter(language => language.status == "active")
  const [error, setError] = useState([])

  const isUserBusy = async (agentId) => {
    return activeDrivers.filter(driver => driver.status == "assigned" && driver.agent == Number(agentId)).length > 0;
  }

  const handleUserUpdate = async (name, value) => {
    if (name !== "language" && await isUserBusy(currentUser.pk) === true) {
      setError(`Unable to update ${name}! Please complete your task and try again.`)
      return
    }
    if (name === "location") {
      if (allAgents.filter(agent => agent.location == value).length>0) {
        setError(`This location is already reserved by ${allAgents.filter(agent => agent.location == value)[0].username}!`)
        return
      }
    }
    try {
      await updateDoc(doc(db, addPrefix("users"), String(currentUser.pk)), {
        [name]: value,
      });
      setCurrentUser({ ...currentUser, [name]: value })
      setError("")
    } catch (err) {
      setError("Unable to update user in database!")
    }
  }

  const handleLoginAsAdmin = async () => {
    if (await isUserBusy(currentUser.pk) === true) {
      setError("Please complete the assigned task in order to switch to admin!")
    }
    else {
      try {
        if (currentUser.pk) {
          await updateDoc(doc(db, addPrefix("users"), String(currentUser.pk)), {
            status: "inactive",
            "isAgent": false,
          });
        }
        window.location.reload(false);
      } catch (err) {
        setError("Error: Unable to login as admin!")
      }
    }
  }
 
  return (<>
    <Navbar light expand="xs" className="vms-header">
      <Nav className="mr-auto" navbar>
        <UncontrolledDropdown nav inNavbar style={{ marginLeft: "15px", fontSize: "16px" }}>
          <DropdownToggle nav caret>
            <span className={"vms-avatar " + (currentUser.status === "active" ? "border-green" : "")} style={{ width: "50px" }}>
              <img src={driverPlaceholder} className="w-100" alt="" />
            </span>&nbsp;&nbsp;&nbsp;&nbsp;{currentUser.username}
          </DropdownToggle>
          <DropdownMenu right>
            <DropdownItem onClick={() => handleUserUpdate("status", currentUser.status === "active" ? "inactive" : "active", false)}><b>{currentUser.status === "active" ? "Inactive" : "Active"}</b></DropdownItem>
            <DropdownItem divider />
            {currentUser.groupNames && currentUser.groupNames.includes("VMS-Admin") && <DropdownItem onClick={() => handleLoginAsAdmin()}><b>Switch To Admin</b></DropdownItem>}
            <DropdownItem divider />
            <DropdownItem onClick={() => handleLogout()}><b>Logout</b></DropdownItem>
          </DropdownMenu>
        </UncontrolledDropdown>
        {error && error != "" && <ErrorModal open={!!error} handleClose={() => setError("")} message={error} />}
        <UncontrolledDropdown nav inNavbar className="float-right" style={{ margin: "15px", fontSize: "16px" }}>
          <DropdownToggle nav caret>
            <b>{currentUser.location ? currentUser.location : "No Location Selected"}&nbsp;&nbsp;&nbsp;</b>
          </DropdownToggle>
          <DropdownMenu>
            {allLocations?.map(loc =>
              <><DropdownItem onClick={() => handleUserUpdate("location", loc.name)}><b>{loc.name}</b></DropdownItem><DropdownItem divider /></>
            )}
          </DropdownMenu>
        </UncontrolledDropdown>
        <UncontrolledDropdown nav inNavbar className="float-right" style={{ margin: "15px", fontSize: "16px" }}>
          <DropdownToggle nav caret>
            <b>{currentUser.language ? currentUser.language : "No Language Selected"}&nbsp;&nbsp;&nbsp;</b>
          </DropdownToggle>
          <DropdownMenu>
            {allLanguages?.map((lang, i) =>
              <><DropdownItem key={i} onClick={() => handleUserUpdate("language", lang.name)}><b>{lang.name}</b></DropdownItem><DropdownItem divider /></>
            )}
          </DropdownMenu>
        </UncontrolledDropdown>
      </Nav>
    </Navbar>
    <QueueContainer currentUser={currentUser} setCurrentUser={setCurrentUser} allAgents={allAgents} activeDrivers={activeDrivers} key={123} />
    {/* {loading &&<center> <img src={loader} alt="centered image" width="100"  style={{marginBottom:-70,marginTop:10}}/></center>} */}
  </>)
}

export default Agent
