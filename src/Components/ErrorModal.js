import React from 'react'
import { Modal, ModalBody, Button, Row, Col } from 'reactstrap';

function ErrorModal({open, handleClose, message}) {
    return (
        <Modal isOpen={open} toggle={handleClose} className="vms-error-modal">
        <ModalBody className="px-0 pb-0">
            <Row>
                <Col className="text-center">
                    <h1>
                        <i className="fa fa-exclamation-triangle" style={{color: "red"}} aria-hidden="true" />
                    </h1>
                </Col>
            </Row>
            <Row>
                <Col className="text-center pt-3">
                    <h3>
                        Oh snap!
                    </h3>
                    <p style={{fontSize: "16px"}} className="px-5">{message}</p>
                </Col>
            </Row>
            <Row>
                <Col className="text-center pt-3">
                    <Button className="btn w-100 py-3" style={{backgroundColor: "red", color:"white", borderRadius:"0px"}} onClick={handleClose}>Dismiss</Button>
                </Col>
            </Row>
        </ModalBody>
    </Modal>
    )
}

export default ErrorModal
