import { useState } from 'react'
import { Container, Row, Col, Button } from 'reactstrap';
import driverPlaceholder from '../assets/placeholder.png'
import TicketModal from './TicketModal';
import QueueContent from './QueueContent';
import moment from 'moment';

function QueueContainer({ currentUser, setCurrentUser, height, activeDrivers, newDrivers, allAgents }) {
    const tickets = activeDrivers.filter(driver => driver.status == "waiting")
    const [showModal, setShowModal] = useState("")
    const isAgent = currentUser && currentUser.pk ? true : false

    const sendMessage = (to, body) => {
        fetch(`${process.env.REACT_APP_MESSENGER_API}/Message`, {
            method: 'POST',
            headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
            body: JSON.stringify({
                to: to,
                from: '+18885248449',
                body: body,
                Subject: 'Office VMS'
            })
        }).then((response) => {
            if (response && response.status && response.status === 200) return true
            else throw ("An error occured while sending message to driver. Please try again!")
        }).catch(error => {
                throw ("An error occured while sending message to driver. Please try again!")
        });
    }
    
    return (
        <Container fluid>
            <Row className="vms-main-wrapper" style={{ height: (height ? height : null)}}>
                <Col xs={isAgent ? 4 : 2} className="vms-queue-sidebar">
                    <Row className="vms-queue-sidebar-title">
                        <Col>VISITOR'S QUEUE</Col>
                    </Row>
                    {tickets?.map((driver, i) =>
                        <Row className="vms-queue-item" onClick={() => setShowModal("showDriver" + driver.pk)} key={i}>
                            {showModal === "showDriver" + driver.pk && <TicketModal handleClose={() => setShowModal("")} open={showModal === "showDriver" + driver.pk} driver={driver} allAgents={allAgents} currentUser={currentUser} handleMessage={sendMessage} tickets={activeDrivers} />}
                            <Col xs={isAgent ? 2 : 3} className="text-center pt-2">
                                <i className="fa fa-user-circle-o" aria-hidden="true" style={{fontSize: "3rem", color: "#393e5c"}} />
                                {/* <div className="vms-avatar w-100 h-auto">
                                    <img src={driverPlaceholder} className="w-100" alt="" />
                                </div> */}
                            </Col>
                            <Col xs={isAgent ? 10 : 9}>
                                <Row>
                                    <Col>
                                        <h3 className="limit-text mb-3">{driver.name}</h3>
                                        <p className="vms-queue-item-date">{moment(driver.dateAdded.toDate()).format('lll')}</p>
                                        {isAgent && <p className="vms-queue-item-date">Balance: <b>{"$" + driver.balance}</b></p>}
                                    </Col>
                                    {isAgent && 
                                        <Col>
                                            <h3 className="limit-text mb-3" style={{color: "#393e5c"}}><i className="fa fa-language" aria-hidden="true" /> {driver.language}</h3>
                                            <p className="vms-queue-item-moves">Back To Queue: <b>{driver.backToQueue ? driver.backToQueue.length : 0}</b></p>
                                            <p className="vms-queue-item-moves">Transferred: <b>{driver.transfers ? driver.transfers.length : 0}</b></p>
                                        </Col>
                                    }
                                </Row>
                                {isAgent && driver.reasons && driver.reasons.length > 0 &&  <Row>
                                    <Col>
                                        <p className="vms-queue-item-reasons">
                                            <i className="fa fa-hand-o-right" /> {driver.reasons.join(", ")}
                                        </p>
                                    </Col>
                                </Row>}
                            </Col>
                            {isAgent && 
                                <Col className="pb-3">
                                    <small><b>Notes:: </b>{driver.notes}</small>
                                </Col>
                            }
                        </Row>
                    )}
                    {tickets?.length === 0 && <p className="text-center pt-5"><b>No Driver in Queue!</b></p>}
                </Col>
                <Col xs={isAgent ? 8 : 10} className="vms-main-content-container">
                    <QueueContent currentUser={currentUser} setCurrentUser={setCurrentUser} handleMessage={sendMessage} allAgents={allAgents} activeDrivers={activeDrivers} newDrivers={newDrivers} />
                </Col>
            </Row>
        </Container>
    )
}

export default QueueContainer
