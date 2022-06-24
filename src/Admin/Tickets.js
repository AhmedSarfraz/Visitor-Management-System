import { useEffect, useState } from 'react'
import { Row, Col, Table, InputGroup, Input, InputGroupAddon, InputGroupText, Button } from 'reactstrap';
import { collection, getDoc, doc, updateDoc } from "firebase/firestore";
import { db, addPrefix } from '../firebase';
import TicketModal from '../Agent/TicketModal';
import ErrorModal from '../Components/ErrorModal';
import moment from 'moment';

export default function Tickets({ allAgents, filteredTickets, setActivePath, refetchTickets, currentUser }) {
    const [showModal, setShowModal] = useState("")
    const [error, setError] = useState("")
    
    const getAgentName = (agentId) => {
        return agentId ? allAgents?.filter(agent => agent.firebaseId == agentId)[0].username : agentId
    }

    const removeDriverFromQueue = async(driver) => {
        try {
            if (driver && driver.firebaseId) {
                const driverData = await getDoc(doc(db, addPrefix("tickets"), driver.firebaseId));
                let status = driverData.data().status;
                if (status == "waiting"){
                    await updateDoc(doc(db, addPrefix("tickets"), driver.firebaseId), {
                        "status": "removed",
                    });
                    refetchTickets();
                }else{
                    setError(`Error: Can not remove a ticket in ${status}!`)
                }
            }
        } catch (err) {
            setError("Error: Unable to update the status!")
        }
    }

    useEffect(()=>{
        setActivePath("Tickets")
    }, [])

    return (
        <Row className="no-gutters p-5">
            {error && error != "" && <ErrorModal open={!!error} handleClose={() => setError("")} message={error} />}
            <Col>
                <Row className="no-gutters">
                    <Col className="vms-table-wrapper">
                        <Table responsive className="vms-table vms-table-queue">
                            <thead>
                                <tr>
                                    <th>Action</th>
                                    <th>Driver Name</th>
                                    <th>Phone</th>
                                    <th>TLC</th>
                                    <th>Department</th>
                                    <th>Reasons</th>
                                    <th>Check-In Time</th>
                                    <th>Agent</th>
                                    <th>Table @ Time</th>
                                    <th>Time Taken</th>
                                    <th>Push Back</th>
                                    <th>Transfers</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTickets?.map((driver, i) => <tr className="text-capitalize">
                                    {/* {showModal && showModal === ("showBackToQueueDetails" + i) && <BackToQueueDetailModal open={showModal === ("showBackToQueueDetails" + i)} handleClose={() => setShowModal("")} getAgentName={getAgentName} details={driver.backToQueue} />} */}
                                    {showModal && showModal === ("showDriverModal"+i) && <TicketModal handleClose={() => setShowModal("")} open={showModal === "showDriverModal"+i} driver={driver} allAgents={allAgents} currentUser={currentUser} />}
                                    <td> <a href="#" onClick={()=>setShowModal("showDriverModal"+i)}>Info <i class="fa fa-info-circle" aria-hidden="true" /></a> {driver.status === "waiting" && <a href="#" onClick={()=>removeDriverFromQueue(driver)}>Remove <i className="fa fa-times" /></a>}</td>
                                    <td className="limit-text"> <i className="fa fa-circle" aria-hidden="true" style={{ color: driver.status === "waiting" ? "red" : driver.status === "assigned" ? "orange" : driver.status === "completed" ? "green" : "black" }} />&nbsp;&nbsp;<a href={`${process.env.REACT_APP_OFFICE_URL}/driver/${driver.driverId}`} target="_blank">{driver.name} <i className="fa fa-external-link" aria-hidden="true" /></a></td>
                                    <td> {driver.phone} </td>
                                    <td> {driver.tlcLicense} </td>
                                    <td> {driver.department} </td>
                                    <td> {driver.reasons ? driver.reasons.join(", ") : "--"} </td>
                                    <td> {driver.dateAdded ? moment(driver.dateAdded.toDate()).format('lll') : "--"} </td>
                                    <td> {driver.agent && allAgents.filter(agent => agent.userPk === driver.agent)?.length > 0 ? allAgents.filter(agent => agent.userPk === driver.agent)[0].username : "--"}</td>
                                    <td> {driver.location ? driver.location : "--"} @ {driver.acceptedAt ? moment(driver.acceptedAt.toDate()).format('lll') : "--"}</td>
                                    <td> {driver.completedAt ? moment.duration(moment(driver.completedAt.toDate()).diff(moment(driver.dateAdded.toDate()))).asMinutes().toFixed(0) : "--"} Minutes</td>
                                    <td> {driver.backToQueue ? driver.backToQueue.length : "--"} </td>
                                    <td> {driver.transfers ? driver.transfers.length : "--"} </td>
                                </tr>)}
                                {filteredTickets?.length === 0 && <tr><td colSpan={11}>No Driver Found!</td></tr>}
                            </tbody>
                        </Table>
                    </Col>
                </Row>
                <Row className="no-gutters pt-5">
                    <Col xs={12}>
                        <i className="fa fa-circle" aria-hidden="true" style={{ color: "red" }} /> <b>&nbsp;&nbsp;Ticket still in waiting</b>
                    </Col>
                    <Col xs={12}>
                        <i className="fa fa-circle" aria-hidden="true" style={{ color: "orange" }} /> <b>&nbsp;&nbsp;Customer is being served</b>
                    </Col>
                    <Col xs={12}>
                        <i className="fa fa-circle" aria-hidden="true" style={{ color: "green" }} /> <b>&nbsp;&nbsp;Ticket is closed</b>
                    </Col>
                    <Col xs={12}>
                        <i className="fa fa-circle" aria-hidden="true" style={{ color: "black" }} /> <b>&nbsp;&nbsp;Ticket is removed</b>
                    </Col>
                </Row>
            </Col>
        </Row>
    )
}
