import { Button, Row, Col, CardBody, Card, Popover, PopoverHeader, PopoverBody, Input, Form } from 'reactstrap';
import { useState, useEffect } from 'react';
import { setDoc, doc } from "firebase/firestore";
import { db, addPrefix } from '../firebase';
import TicketModal from './TicketModal';
import ErrorModal from '../Components/ErrorModal';
import TransferTicketModal from './TransferTicketModal';
import BackToQueueDetailModal from '../Admin/BackToQueueDetailModal';
import TransferDetailModal from '../Admin/TransferDetailModal';
import DriverPlaceholder from '../assets/placeholder.png'
import Carousel from '../Components/Carousel';
import moment from 'moment';

function QueueContent({ currentUser, handleMessage, activeDrivers, newDrivers, allAgents}) {
    const users = allAgents.filter(agent => agent.status == "active")
    const assignedTickets = activeDrivers.filter(driver => driver.status == "assigned")

    const [backReason, setBackReason] = useState(null)
    const [newTickets, setNewTickets] = useState()
    const [error, setError] = useState("")
    const [showModal, setShowModal] = useState("")
    const [canAnnounce, setCanAnnounce] = useState(true)

    const getAgentName = (agentId) => {
        return agentId && users?.filter(agent => agent.firebaseId == agentId)?.length > 0 ? users?.filter(agent => agent.firebaseId == agentId)[0].username : agentId
    }

    const handleBackToQueue = async (ticket, reason=backReason) => {
        if(!ticket || !reason){
            setError("Reason is required field for back to queue action. Please try with complete details!")
            return
        }
        const ticketRef = doc(db, addPrefix("tickets"), ticket.firebaseId);
        try {
            let input = { 
                "by": currentUser.pk, 
                "reason": reason, 
                oldLocation: ticket.location, 
                "acceptedAt": ticket.acceptedAt, 
                "backAfter": Number(moment.duration(moment().diff(moment(ticket.acceptedAt.toDate()))).asMinutes().toFixed(0)) 
            }
            await setDoc(ticketRef, {
                status: "waiting",
                agent: null, location: null, acceptedAt: null,
                backToQueue: ticket.backToQueue ? [...ticket.backToQueue, input] : [input]
            }, { merge: true });
            try {
                handleMessage(ticket.phone, "We are experiencing some issues and your file will need to be reviewed by a different agent. Please wait, it shouldn't be long.")
            } catch (error) {
                setError(error)
            }
        } catch (err) {
            setError("Error while updating driver! Please contact admin." + err)
        }
    }

    const consumeTickets = async (tickets = newTickets) => {
        let ticketToAnnounce = null
        if (!currentUser) {
            if (tickets?.length > 0) ticketToAnnounce = tickets[0]
        }
        if (ticketToAnnounce) {
            let text = `${ticketToAnnounce.name} please proceed to ${ticketToAnnounce.location}. ${getAgentName(ticketToAnnounce.agent)} is waiting for you!`
            await fetch('https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=AIzaSyBMlIl8hn-dS3CXzcHbZgoDliPVV9H5gZw', {
                method: 'post', body: JSON.stringify({
                    "audioConfig": {
                        "audioEncoding": "LINEAR16",
                        "pitch": 0,
                        "speakingRate": 1
                    },
                    "input": { "text": `${text}` },
                    "voice": {
                        "languageCode": "en-US",
                        "name": "en-US-Wavenet-G"
                    }
                })
            }).then(response => response.json()).then((data) => {
                const audio = new Audio("data:audio/wav;base64," + data.audioContent);
                setCanAnnounce(false)
                audio.onended = function () {
                    setNewTickets(newTickets.filter(item => item.firebaseId != ticketToAnnounce.firebaseId))
                    setCanAnnounce(true)
                }
                audio.play()
            });
        }
    }

    useEffect(() => {
        setNewTickets(newDrivers)
    }, [newDrivers])
    
    useEffect(() => {
        if (canAnnounce && newTickets?.length > 0)
            consumeTickets()
    }, [newTickets, canAnnounce])
    

    return (
        users?.length > 0 &&
        <>{error && error != "" && <ErrorModal open={!!error} handleClose={() => setError("")} message={error} />}
            <Carousel show={4} infiniteLoop={true} navigation={true}>
                {users?.filter(agent => currentUser && currentUser.pk ? agent.userPk === currentUser.pk : true)?.map((agent, i) =>
                    <div className="vms-queue-content-wrapper" key={i}>
                        <Card className="vms-queue-content-agent-wrapper">
                            <CardBody>
                                <span className={"vms-avatar " + (agent.status === "active" ? "border-green" : "")}>
                                    <img src={DriverPlaceholder} className="w-100" alt="" />
                                </span>&nbsp;&nbsp;&nbsp;&nbsp;
                                <span className="vms-agent-detail-card">
                                    <h3>{agent.username}</h3>
                                    <p>{agent.location ? agent.location : "Not Assigned"} | <b style={{color:"#db9360"}}>{agent.language ? agent.language : "--"}</b></p>
                                </span>
                            </CardBody>
                        </Card>
                        {assignedTickets?.filter(ticket => ticket.agent === agent.userPk)?.map((ticket, j) =>
                            <Card className="vms-queue-content-driver-wrapper" key={i + String(j)}>
                                {showModal === "showTicket" + ticket.pk && currentUser && currentUser.id && <TicketModal handleClose={() => setShowModal("")} open={showModal === "showTicket" + ticket.pk} driver={ticket} allAgents={allAgents} currentUser={currentUser} handleMessage={handleMessage} tickets={activeDrivers}/>}
                                {showModal === "transferTicket" + ticket.pk && currentUser && currentUser.id && <TransferTicketModal handleClose={() => setShowModal("")} open={showModal === "transferTicket" + ticket.pk} driver={ticket} onlineAgents={users} assignedTickets={assignedTickets} currentUser={currentUser} handleMessage={handleMessage} />}
                                {/* {showModal && showModal === ("showBackToQueueDetails" + j) && <BackToQueueDetailModal open={showModal === ("showBackToQueueDetails" + j)} handleClose={() => setShowModal("")} getAgentName={getAgentName} details={ticket.backToQueue} />}
                                {showModal && showModal === ("showTransferDetails" + j) && <TransferDetailModal open={showModal === ("showTransferDetails" + j)} handleClose={() => setShowModal("")} getAgentName={getAgentName} details={ticket.transfers} />} */}

                                <CardBody>
                                    <div className="vms-avatar border-green">
                                        <img src={DriverPlaceholder} className="w-100" alt="" />
                                    </div>
                                    <h3>{ticket.name} {currentUser && currentUser.pk && <a href={`${process.env.REACT_APP_OFFICE_URL}/driver/${ticket.driverId}`} style={{ fontSize: "1rem" }} target="_blank"><i className="fa fa-external-link" aria-hidden="true" /></a>}</h3>
                                    {currentUser && currentUser.pk && 
                                        <Row className="vms-queue-content-driver-details">
                                            <Col xs={12}>
                                                <p>{ticket.department ? ticket.department : "--"} | {ticket.phone ? ticket.phone : "--"} | {ticket.language ? ticket.language : "--"}</p>
                                                <p><b>Balance:</b> {ticket.balance ? ticket.balance + "$" : "--"} | <b>Reasons:</b> {ticket.reasons ? ticket.reasons.join(", ") : "--"}</p>
                                                {ticket && ticket.tags && ticket.tags.length > 0 && <p> 
                                                    {ticket.tags.map((tag, i) => <span className="vms-driver-taglist" key={i}>{tag}</span>)}
                                                </p>}
                                                <p className="vms-driver-notes"><b>Notes:</b> {ticket.notes ? ticket.notes : "--"}</p>
                                                <p> <b>Back To Queue: </b>{ticket.backToQueue ? ticket.backToQueue.length : "--"} | <b>Transferred: </b>{ticket.transfers ? ticket.transfers.length : "--"} </p>
                                            </Col>
                                        </Row>
                                    }
                                    {currentUser && currentUser.pk && <>
                                        <Row className="pt-3">
                                            <Col xs={4}>
                                                <Button className="px-4 py-3" id="backQueueButton" color="primary" onClick={()=>setShowModal("askBackToQueueReason")}>Push Back</Button>
                                                {currentUser && currentUser.pk && showModal === "askBackToQueueReason" && <Popover placement="right" isOpen={showModal === "askBackToQueueReason"} target="backQueueButton" toggle={()=>setShowModal("")}>
                                                    <PopoverHeader>Reason to Put it Back</PopoverHeader>
                                                    <PopoverBody>
                                                        <Form onSubmit={(e) => {e.preventDefault(); handleBackToQueue(ticket, backReason)}}>
                                                            <Input type="textarea" placeholder="Reason to put ticket back in the queue" value={backReason} onChange={(e)=>setBackReason(e.target.value)}></Input>
                                                            <Button className="float-right m-3" type="submit">Submit</Button>
                                                        </Form>
                                                    </PopoverBody>
                                                </Popover>}
                                            </Col>
                                            <Col xs={4}>
                                                <Button className="px-4 py-3" color="primary" onClick={() => setShowModal("transferTicket" + ticket.pk)}>Transfer</Button>
                                            </Col>
                                            <Col xs={4}>
                                                <Button className="px-4 py-3" onClick={() => setShowModal("showTicket" + ticket.pk)}>Complete</Button>
                                            </Col>
                                        </Row>
                                        {/* <Row className="pt-3">
                                            <Col>
                                                <Button className="px-4 py-2 w-100" onClick={() => setShowModal("showTicket" + ticket.pk)}>Ticket Details</Button>
                                            </Col>
                                        </Row> */}
                                        </>
                                    }
                                </CardBody>
                            </Card>
                        )}
                    </div>
                )}
            </Carousel>
        </>
    )
}

export default QueueContent
