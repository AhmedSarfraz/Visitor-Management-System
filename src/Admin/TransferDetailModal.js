import React from 'react'
import { useState } from 'react'
import { Modal, ModalBody, Card, Row, Col, Badge, ModalHeader, ModalFooter, Button } from 'reactstrap';
import moment from 'moment';

function TransferDetailModal({handleClose, open, details, getAgentName}) {
    const [error, setError] = useState("")
    return (
        <Modal isOpen={open} toggle={handleClose} className="vms-ticket-modal">
            <ModalHeader style={{alignSelf: "center"}} tag={"h3"}>
                Ticket Transfer Details
            </ModalHeader>
            <ModalBody>
                {error && <Col xs={12} className="text-center pb-3"><Badge color="danger" style={{whiteSpace: "pre-line"}}>{error}</Badge></Col>}
                {details?.map((detail,i)=><>
                    {i>0 && <Row><Col xs={{size:1, offset:1}}><div style={{borderLeft: "6px solid #db9360", height: "50px"}}></div></Col></Row>}
                    <Card className={(i+1===details.length ? "bg-muted" : "bg-muted") + " text-center my-0 pt-3"}>
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
            </ModalBody>
            <ModalFooter>
                <Button className="btn float-right" onClick={handleClose}>Close</Button>
            </ModalFooter>
        </Modal>
    )
}

export default TransferDetailModal
