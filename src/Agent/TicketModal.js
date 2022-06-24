import { useState } from 'react'
import { Modal, ModalBody, Button, Row, Col, Badge, Nav, NavItem, NavLink, TabContent, TabPane, Card } from 'reactstrap';
import { db, addPrefix } from '../firebase';
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import driverPlaceholder from '../assets/placeholder.png'
import moment from 'moment';

function TicketModal({ open, handleClose, driver, currentUser, handleMessage, tickets, allAgents }) {
    // const [nextDriver] = useState(tickets && tickets.length > 0 ? tickets.filter(item => item.status === "waiting")[0] : [])
    const [activeTab, setActiveTab] = useState("details")
    const [error, setError] = useState("")

    const getAgentName = (agentId) => {
        return agentId && allAgents?.filter(agent => agent.firebaseId == agentId)?.length > 0 ? allAgents?.filter(agent => agent.firebaseId == agentId)[0].username : agentId
    }

    const AssignAgentToDriver = async (driver, tickets) => {
        if (tickets.filter(ticket => ticket.status == "assigned" && ticket.agent == Number(currentUser.pk)).length > 0) {
            setError('Error: Please complete the assigned task before accepting next task!')
            return
        }
        if (currentUser && currentUser.pk && currentUser.status === "active" && currentUser.location) {
            const driverRef = doc(db, addPrefix("tickets"), driver.firebaseId);
            try {
                await updateDoc(driverRef, { "agent": currentUser.pk, location: currentUser.location, status: "assigned", acceptedAt: serverTimestamp() })
                try {
                    await handleMessage(driver.phone, "Hi " + driver.name + "! \n\nPlease come to station " + currentUser.location + " to speak with " + currentUser.username.toUpperCase() + ".")
                } catch (error) {
                    setError(error)
                }
                handleClose();
            } catch (err) {
                setError("Error while updating driver! Please contact admin.")
            }
        } else if (currentUser && currentUser.pk && currentUser.status === "inactive") setError("Error while assigning driver! Agent should be active in order to accept the ticket")
        else if (currentUser && currentUser.pk && !currentUser.location) setError("Error while assigning driver! Agent should select the location in order to accept the ticket")
        else setError("Error while assigning driver! Please contact admin for support!")
    }

    const handleCompleteTask = async () => {
        const driverRef = doc(db, addPrefix("tickets"), driver.firebaseId);
        try {
            updateDoc(driverRef, { status: "completed", completedAt: serverTimestamp() })
            handleMessage(driver.phone, "Thank you for choosing Buggy, we hope today has been a pleasure for you as it has been for us. We appreciate your business and if you have any questions please reach out to 347-334-6313")
        } catch (err) {
            setError("Error while updating driver! Please contact admin.")
        }
    }

    return (
        <Modal isOpen={open} toggle={handleClose} className="vms-ticket-modal">
            <ModalBody>
                <button className="btn float-right" onClick={handleClose}><i className="fa fa-times" aria-hidden="true" /></button>
                {error && <Col xs={12} className="text-center pb-3"><Badge color="danger" style={{ whiteSpace: "pre-line" }}>{error}</Badge></Col>}
                <Nav tabs>
                    <NavItem>
                        <NavLink className={activeTab === "details" ? "active" : ""} onClick={()=>setActiveTab("details")}>
                            Ticket Details
                        </NavLink>
                    </NavItem>
                    {currentUser && currentUser.id && <>
                    <NavItem>
                        <NavLink className={activeTab === "back" ? "active" : ""} onClick={()=>setActiveTab("back")}>
                            Back To Queue Details:&nbsp;&nbsp;<b>{driver.backToQueue?.length || 0}</b>
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink className={activeTab === "transfer" ? "active" : ""} onClick={()=>setActiveTab("transfer")}>
                            Transfer Details:&nbsp;&nbsp;<b>{driver.transfers?.length || 0}</b>
                        </NavLink>
                    </NavItem>
                    </>}
                </Nav>
                <TabContent activeTab={activeTab} className="p-3">
                    <TabPane tabId="details">
                        <Row>
                            <Col xs={{ size: 4, offset: 1 }}>
                                <div className="vms-avatar w-100 h-auto">
                                    <img src={driverPlaceholder} className="w-100" alt="" />
                                </div>
                            </Col>
                            <Col xs={{ size: 7 }} className="vms-driver-data">
                                <h2>{driver.name} <a href={`${process.env.REACT_APP_OFFICE_URL}/driver/${driver.driverId}`} style={{ fontSize: "1rem" }} target="_blank"><i className="fa fa-external-link" aria-hidden="true" /></a></h2>
                                <p>{driver.department ? driver.department : "--"} <b>|</b> {driver.language ? driver.language : "--"} <b>|</b> {driver.phone ? driver.phone : "--"}</p>
                                {currentUser && currentUser.id && driver && driver.tags && driver.tags.length > 0 && <p> 
                                    {driver.tags.map((tag, i) => <span className="vms-driver-taglist" key={i}>{tag}</span>)}
                                </p>}
                                {currentUser && currentUser.id && <p>Balance: {driver.balance ? driver.balance + "$" : "--"}</p>}
                                <p className="vms-driver-reasons">Reasons: {driver.reasons ? driver.reasons.join(", ") : "No Reason Selected"}</p>
                                {/* <p>Back To Queue: {driver.backToQueue ? driver.backToQueue.length : "0"} <b>|</b> Transferred: {driver.transfers ? driver.transfers.length : "0"} </p> */}
                                {currentUser && currentUser.id && driver.status === "assigned"  && <p>Time Taken: {moment.duration(moment().diff(moment(driver.dateAdded.toDate()))).asMinutes().toFixed(0)} Minutes</p>}
                            </Col>
                            {driver.notes && <p className="vms-driver-notes">Driver Notes: {driver.notes}</p>}
                        </Row>
                        <Row>
                            <Col className="mt-4">
                                {console.log(currentUser)}
                                {currentUser && currentUser.id && currentUser.isAgent === true && driver.status === "waiting" ?
                                    <Button color="primary" className="px-4 py-2 w-100" onClick={() => { AssignAgentToDriver(driver, tickets); }}>Accept Ticket</Button>
                                :currentUser && currentUser.id && currentUser.isAgent === true && driver.status === "assigned" ?
                                    <Button color="secondary" className="px-4 py-2 w-100" onClick={() => { handleCompleteTask(); handleClose(); }}>Complete Ticket</Button> 
                                : ""
                                }   
                            </Col>
                        </Row>
                    </TabPane>
                    <TabPane tabId="back">
                        <h2 className="text-center">Ticket Back To Queue Details</h2> <br/>
                        <div className="vms-details-list-wrapper">
                            {driver.backToQueue?.map((detail,i)=><>
                                {i>0 && <Row><Col xs={{size:1, offset:1}}><div style={{borderLeft: "6px solid #db9360", height: "50px"}}></div></Col></Row>}
                                <Card className="bg-muted text-center my-0 pt-3">
                                    <Row>
                                        <Col><p><b>Accepted At</b><br/>{moment(detail.acceptedAt.toDate()).format('lll')}</p></Col>
                                        <Col><p><b>Move Back After</b><br/>{detail.backAfter} MIN</p></Col>
                                        <Col><p><b>Move By</b><br/>{getAgentName(detail.by)}</p></Col>
                                        <Col><p><b>Previous Location</b><br/>{detail.oldLocation}</p></Col>
                                    </Row>
                                    <Row>
                                        <Col><p className="px-5 text-left"><b>Reason:</b>&nbsp;&nbsp;&nbsp;&nbsp;{detail.reason}</p></Col>
                                    </Row>
                                </Card>
                                </>
                            )}
                            {(!driver.backToQueue || driver.backToQueue?.length === 0) && <p>No Records Found for Back To Queue!</p>}
                        </div>
                    </TabPane>
                    <TabPane tabId="transfer">
                        <h2 className="text-center">Ticket Transfer Details</h2> <br/>
                        <div className="vms-details-list-wrapper">
                            {driver.transfers?.map((detail,i)=><>
                                {i>0 && <Row><Col xs={{size:1, offset:1}}><div style={{borderLeft: "6px solid #db9360", height: "50px"}}></div></Col></Row>}
                                <Card className={"bg-muted text-center my-0 pt-3"}>
                                    <Row>
                                        <Col xs={3}><p><b>Accepted At</b><br/>{moment(detail.acceptedAt.toDate()).format('lll')}</p></Col>
                                        <Col xs={2}><p><b>By</b><br/>{detail.madeBy ? getAgentName(detail.madeBy) : "--"}</p></Col>
                                        <Col xs={2}><p><b>To</b><br/>{detail.transferredTo ? getAgentName(detail.transferredTo) : "--"}</p></Col>
                                        <Col><p><b>Transferred After</b><br/>{detail.transferredAfter ? detail.transferredAfter : "--"} MIN</p></Col>
                                        <Col><p><b>Prev Location</b><br/>{detail.oldLocation}</p></Col>
                                    </Row>
                                    <Row className="no-gutters">
                                        <Col><p className="px-5 text-left"><b>Reason:</b>&nbsp;&nbsp;&nbsp;&nbsp;{detail.reason}</p></Col>
                                    </Row>
                                </Card>
                                </>
                            )}
                            {(!driver.transfers || driver.transfers.length == 0) && <p>No Records Found for Transferring Ticket!</p>}
                        </div>
                    </TabPane>
                </TabContent>
            </ModalBody>
        </Modal>
    )
}

export default TicketModal
