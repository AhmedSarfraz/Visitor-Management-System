import { useState } from 'react'
import { Modal, ModalBody, Button, Row, Col, Badge, Input, FormGroup, Label, Form } from 'reactstrap';
import driverPlaceholder from '../assets/placeholder.png'
import { db, addPrefix } from '../firebase';
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import moment from 'moment';

function TransferTicketModal({ open, handleClose, driver, currentUser, onlineAgents, assignedTickets, handleMessage }) {
    
    const [error, setError] = useState("")
    const [newAgent, setNewAgent] = useState(null)
    const [transferReason, setTransferReason] = useState(null)
    const servingTickets = assignedTickets?.filter(ticket => ticket.agent && ticket.agent != "" && ticket.agent != currentUser.pk)
    const isUserBusy = async (agentId) => {
        return assignedTickets.filter(driver => driver.status == "assigned" && driver.agent == Number(agentId)).length > 0;
    }

    const TransferDriver = async (driver = driver, newAgent = newAgent, reason = transferReason) => {
        if(!driver || !newAgent || !reason){
            setError("Reason and Agent are required fields for transferring a ticket. Please try with complete details!")
            return
        }
        if (await isUserBusy(newAgent.userPk) === true) {
            setError("This agent is currently serving a customer. Please try again later!")
            return
        }
        if (!newAgent.location || newAgent.location == "") {
            setError("This agent does not selected any location. Please contact admin or ask agent to choose a location!")
            return
        }
        try {
            const ticketRef = doc(db, addPrefix("tickets"), String(driver.firebaseId));
            let input = { 
                "madeBy": currentUser.pk, 
                "oldLocation": driver.location, 
                "transferredTo": Number(newAgent.userPk), 
                "reason": reason, 
                "acceptedAt": driver.acceptedAt, 
                "transferredAfter": Number(moment.duration(moment().diff(moment(driver.acceptedAt.toDate()))).asMinutes().toFixed(0)) 
            }
            await setDoc(ticketRef, {
                agent: Number(newAgent.userPk),
                acceptedAt: serverTimestamp(),
                location: newAgent.location,
                transfers: driver.transfers ? [...driver.transfers, input] : [input]
            }, { merge: true });
            try {
                await handleMessage(driver.phone, "Hi " + driver.name + "! \n\nTo better assist you, Please go to station " + driver.location + " to speak with representative " + newAgent.username.toUpperCase() + ".")
            } catch (error) {
                setError(error)
            }
            handleClose()
            setError("")
        } catch (err) {
            setError("Error: Unable to transfer driver, Please contact admin for support! " + err)
        }
    }

    return (
        <Modal isOpen={open} toggle={handleClose} className="vms-ticket-modal">
            <ModalBody>
                <button className="btn float-right" onClick={handleClose}><i className="fa fa-times" aria-hidden="true" /></button>
                {error && <Col xs={12} className="text-center pb-3"><Badge color="danger" style={{ whiteSpace: "pre-line" }}>{error}</Badge></Col>}
                <Row>
                    <Col xs={{ size: 4, offset: 1 }}>
                        <div className="vms-avatar w-100 h-auto">
                            <img src={driverPlaceholder} className="w-100" alt="" />
                        </div>
                    </Col>
                    <Col xs={{ size: 7 }} className="vms-driver-data">
                        <h2>{driver.name}</h2>
                        <p>{driver.language ? driver.language : "--"} | {driver.phone ? driver.phone : "--"}</p>
                        <p>Balance: {driver.balance+"$"}</p>
                        {driver && driver.tags && driver.tags.length > 0 && driver.tags.map((tag, i) =>
                            <span key={i}><span className="vms-driver-taglist">{tag}</span> </span>
                        )}
                        <div><br></br></div>
                        <p className="vms-driver-reasons">Reasons: {driver.reasons ? driver.reasons.join(", ") : "No Reason Selected"}</p>
                    </Col>
                    {driver.notes && <p className="vms-driver-notes">Driver Notes: {driver.notes}</p>}
                </Row>
                {currentUser && currentUser.id &&
                    <Form onSubmit={(e) => {e.preventDefault(); TransferDriver(driver, newAgent, transferReason)}}><Row className="mt-4">
                        <Col>
                            <FormGroup>
                                <Label for="agent">Transfer To *</Label>
                                <Input id="agent" type="select" value={newAgent ? newAgent.userPk : ""} onChange={(e) => setNewAgent(onlineAgents?.filter(agent => agent.userPk == e.target.value)[0])}>
                                    <option value="">--Select Agent To Transfer Ticket--</option> 
                                    {onlineAgents?.filter(agent => currentUser && currentUser.pk ? agent.userPk !== currentUser.pk : false)?.map((agent, i) => {
                                        let serving = servingTickets?.filter(ticket => ticket.agent === agent.userPk)?.map(ticket => ticket.name)?.join(", ") || false;
                                        return <option value={agent.userPk} key={i} disabled={serving}>{agent.username} - {serving ? serving : "Agent is Free!"} - {agent.location ? agent.location : "No Location Selected"}</option>
                                    }
                                    )}
                                </Input>
                            </FormGroup>
                        </Col>
                        <Col>
                            <FormGroup>
                                <Label for="reason">Reason *</Label>
                                <Input id="reason" type="textareaa" value={transferReason} onChange={(e) => setTransferReason(e.target.value)} placeholder="Reason to Transfer" />
                            </FormGroup>
                        </Col>
                        <Col xs={3} className="pt-3">
                            <Button color="primary" className="px-4 py-2 w-100" disabled={!newAgent} type="submit">Transfer Ticket</Button>
                        </Col>
                    </Row></Form>
                }
            </ModalBody>
        </Modal>
    )
}

export default TransferTicketModal
