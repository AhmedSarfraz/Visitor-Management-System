import { useEffect, useState } from 'react'
import { Row, Col, Table, InputGroup, Input, InputGroupAddon, InputGroupText, Button } from 'reactstrap';
import { updateDoc, doc } from "firebase/firestore";
import { db, addPrefix } from '../firebase';
import ErrorModal from '../Components/ErrorModal';
import moment from 'moment';

export default function Agents({allAgents, activeDrivers, setActivePath}) {
  const [allUsers, setAllUsers] = useState(allAgents)
  const [filters, setFilters] = useState({ status: "" })
  const [error, setError] = useState("")

  const isUserBusy = async (agentId) => {
    return activeDrivers.filter(driver => driver.status == "assigned" && driver.agent == Number(agentId)).length > 0;
  }

  const updateUserStatus = async (agentId, value) => {
    if (await isUserBusy(agentId) === true) {
      setError("This agent is currently serving a customer. Please try again later!")
      return
    }
    try {
      await updateDoc(doc(db, addPrefix("users"), String(agentId)), {
        "status": value,
      });
      setError("")
    } catch (err) {
      setError("Error: Unable to update user in database!")
    }
  }

  const unsetUserLocation = async (agentId) => {
    if (await isUserBusy(agentId) === true) {
      setError("This agent is currently serving a customer. Please try again later!")
      return
    }
    try {
      await updateDoc(doc(db, addPrefix("users"), String(agentId)), {
        "location": null,
      });
      setError("")
    } catch (err) {
      setError("Error: Unable to update user in database!")
    }
  }

  useEffect(() => {
    let agents = allAgents;
    if(filters.status) agents = agents.filter(agent => agent.status == filters.status);
    setAllUsers(agents)
  }, [filters, allAgents])

  useEffect(()=>{
    setActivePath("Agents")
}, [])

  return (
    <Row className="no-gutters p-5">
      <Col>
        <Row className="vms-filters-wrapper no-gutters">
          <Col xs={{ size: 3, offset: 9 }}>
            <InputGroup>
              <Input type="select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">-- Filter by Status --</option>
                {["active", "inactive"]?.map(item => <option value={item}>{item}</option>)}
              </Input>
              <InputGroupAddon addonType="append">
                <InputGroupText><i className="fa fa-search" aria-hidden="true"></i></InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </Col>
        </Row>
        <Row className="no-gutters">
          {error && error !== "" && <ErrorModal open={!!error} handleClose={() => setError("")} message={error} />}
          <Col className="vms-table-wrapper">
            <Table responsive className="vms-table vms-table-queue">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Location</th>
                  <th>Date Added</th>
                  <th>Serving</th>
                  <th>Total Served</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {allUsers?.map(agent => <tr className="text-capitalize">
                  <td className="limit-text"> <i className="fa fa-circle" aria-hidden="true" style={{ color: agent.status === "active" ? "green" : "red" }} />&nbsp;&nbsp;{agent.username}</td>
                  <td> {agent.location} </td>
                  <td> {agent.dateAdded ? moment(agent.dateAdded.toDate()).format('lll') : "--"} </td>
                  <td> {activeDrivers?.filter(item => item.agent === agent.userPk && item.status === "assigned")?.length > 0 ? activeDrivers?.filter(item => item.agent === agent.userPk && item.status === "assigned")[0].name : "--"} </td>
                  <td> {activeDrivers?.filter(item => item.agent === agent.userPk && item.status === "completed")?.length} </td>
                  <td>
                    <Button color={agent.status === "active" ? "primary" : "secondary"} onClick={() => updateUserStatus(agent.firebaseId, agent.status === "active" ? "inactive" : "active", false)}>Make {agent.status === "active" ? "Inactive" : "Active"}</Button>
                    &nbsp;&nbsp;&nbsp;&nbsp;{agent.location &&
                      <Button color={agent.status === "active" ? "primary" : "secondary"} onClick={() => unsetUserLocation(agent.firebaseId, "")}>Unset Location</Button>
                    }
                  </td>
                </tr>)}
                {allUsers?.length === 0 && <tr><td colSpan={11}>No Agent Found!</td></tr>}
              </tbody>
            </Table>
          </Col>
        </Row>
        <Row className="no-gutters pt-5">
          <Col xs={12}>
            <i className="fa fa-circle" aria-hidden="true" style={{ color: "red" }} /> <b>&nbsp;&nbsp;In-Active Agent</b>
          </Col>
          <Col xs={12}>
            <i className="fa fa-circle" aria-hidden="true" style={{ color: "green" }} /> <b>&nbsp;&nbsp;Active Agent</b>
          </Col>
          <Col xs={12}>
            <i className="fa fa-circle" aria-hidden="true" style={{ color: "black" }} /> <b>&nbsp;&nbsp;Undefined status</b>
          </Col>
        </Row>
      </Col>
    </Row>
  )
}
