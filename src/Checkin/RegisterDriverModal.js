import { useState, useEffect } from 'react'
import { Modal, ModalBody, Button, Row, Col, Badge, ModalHeader, ModalFooter, Input, FormFeedback, FormGroup, Label, FormText } from 'reactstrap';
import gql from 'graphql-tag';
import { useMutation } from '@apollo/client';
import parsePhoneNumber from 'libphonenumber-js'
import States from './States.json'
import Cities from './Cities.json'

const CreateNewDriver = gql`mutation createNewDriver($firstName:String!, $lastName:String!, $phone:String!, $email:String!, $tlcLicense:String!, $city:String!, $state:String!, $streetAddress:String!, $zipCode:String!, $dmvLicense: String!, $isTlc:Boolean) {
    createNewDriver(input:{firstName:$firstName,lastName:$lastName,phone:$phone ,email: $email,tlcLicense: $tlcLicense,city:$city,state:$state,streetAddress:$streetAddress,zipCode:$zipCode,dmvLicense: $dmvLicense,isTlc:$isTlc}) {
        ok
        errors {
            field
            messages
        }
    }
}`;


function RegisterDriverModal({ open, handleClose, input, isPhone, handleNext, driverData, setSearchTerm, refetchDriver }) {
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [tlcValid, setTlcValid] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [driver, setDriver] = useState({
        firstName: "",
        lastName: "",
        phone: isPhone ? input : "",
        email: isPhone ? "" : input,
        streetAddress: "",
        city: "",
        state: "",
        zip: "",
        dmvLicense: "",
        tlcLicense: "",
    })

    const getStateVal = (value) => {
        for (let [key, state] of Object.entries(States)) {
            if (state.trim().toLowerCase() === value.trim().toLowerCase())
                return key
        }
        return undefined
    }

    useEffect(async () => {
        if (driver.tlcLicense) {
            await fetch("https://data.cityofnewyork.us/resource/xjfq-wh2d.json?license_number=" + driver.tlcLicense, {
                method: 'GET',
                data: { "$limit": 1, "$$app_token": "5WBDkAQLj244SKLuDJmXDVDhT" }
            }).then(async (response) => await response.json()).then((data) => {
                if (data && data[0] && data[0].name) setTlcValid(true)
                else setTlcValid(false)
            });
        } else {
            setTlcValid(false)
        }
    }, [driver.tlcLicense])

    const isValid = (name, value) => {
        if (name === "phone") {
            if (value.length < 10) return false
            value = value.includes("+1") ? value : ("+1" + value)
            if (parsePhoneNumber(value)?.isValid()) return true
            else return false
        } else if (name === "email") {
            let re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(String(value).toLowerCase());
        } else if (name === "zip") {
            let re = /(^\d{5}$)|(^\d{5}-\d{4}$)/;
            return re.test(String(value).toLowerCase());
        }
        return value != ""
    }

    const handleRegisterDriver = async () => {
        setIsSubmitted(true);
        setLoading(true);
        let tmp = true;
        let errorItem = '';
        await Object.keys(driver)?.forEach(item => {
            if (item === "tlcLicense") tmp = tlcValid
            else tmp = isValid(item, driver[item])
            errorItem = item
            if (!tmp) return
            tmp = true;
        });
        if (tmp) await registerDriver()
        else setError(`Provide ${errorItem} has invalid value. Please try again with valid value!`);
        setLoading(false);
    }

    const [registerDriver] = useMutation(CreateNewDriver, {
        variables: {
            firstName: driver.firstName,
            lastName: driver.lastName,
            phone: driver.phone.includes("+1") ? driver.phone : ("+1" + driver.phone),
            email: driver.email,
            streetAddress: driver.streetAddress,
            state: driver.state,
            city: driver.city,
            zipCode: driver.zip,
            isTlc: true,
            dmvLicense: driver.dmvLicense,
            tlcLicense: driver.tlcLicense,
        },
        fetchPolicy: 'no-cache',
        onError: (error) => { setError("An error occured. Please contact admin." + error); setLoading(false); },
        onCompleted: async (response) => {
            if (response.createNewDriver.errors == null && response.createNewDriver.ok) {
                await setSearchTerm(isPhone ? driver.phone : driver.email)
                await refetchDriver()
            } else {
                setError(response.createNewDriver.errors[0].messages[0])
                setLoading(false)
            }
        }
    })

    useEffect(() => {
        if (driverData && driverData.id) handleNext()
    }, [driverData])

    return (
        <Modal isOpen={open} toggle={handleClose} className="vms-ticket-modal" style={{ maxWidth: "70%" }}>
            <ModalHeader>Driver Registration</ModalHeader>
            <ModalBody className="px-4">
                <Row>
                    <Col>
                        <FormGroup>
                            <Label for="firstName">First Name *</Label>
                            <Input name="firstName" value={driver.firstName} onChange={(e) => { setDriver({ ...driver, firstName: e.target.value }) }} valid={isValid("firstName", driver.firstName)} invalid={(isSubmitted || driver.firstName) && !isValid("firstName", driver.firstName)} />
                            <FormFeedback>Provided firstname is invalid!</FormFeedback>
                            {/* <FormText>Example help text that remains unchanged.</FormText> */}
                        </FormGroup>
                    </Col>
                    <Col>
                        <FormGroup>
                            <Label for="lastName">Last Name *</Label>
                            <Input name="lastName" value={driver.lastName} onChange={(e) => { setDriver({ ...driver, lastName: e.target.value }) }} valid={isValid("lastName", driver.lastName)} invalid={(isSubmitted || driver.lastName) && !isValid("lastName", driver.lastName)} />
                            <FormFeedback>Provided lastName is invalid!</FormFeedback>
                            {/* <FormText>Example help text that remains unchanged.</FormText> */}
                        </FormGroup>
                    </Col>
                    <Col>
                        <FormGroup>
                            <Label for="phone">Phone *</Label>
                            <Input name="phone" value={driver.phone} onChange={(e) => { setDriver({ ...driver, phone: e.target.value }) }} valid={isValid("phone", driver.phone)} invalid={(isSubmitted || driver.phone) && !isValid("phone", driver.phone)} />
                            <FormFeedback>Provided phone is invalid!</FormFeedback>
                            <FormText>Example: +13473346313</FormText>
                        </FormGroup>
                    </Col>
                    <Col>
                        <FormGroup>
                            <Label for="email">Email *</Label>
                            <Input name="email" value={driver.email} onChange={(e) => { setDriver({ ...driver, email: e.target.value }) }} valid={isValid("email", driver.email)} invalid={(isSubmitted || driver.email) && !isValid("email", driver.email)} />
                            <FormFeedback>Provided email is invalid!</FormFeedback>
                            <FormText>Example: john_doe@gmail.com</FormText>
                        </FormGroup>
                    </Col>
                </Row>
                <br />
                <Row>
                    <Col xs={2}>
                        <FormGroup>
                            <Label for="state">State *</Label>
                            <Input type="select" name="state" value={driver.state} onChange={(e) => { setDriver({ ...driver, state: e.target.value }) }} valid={isValid("state", driver.state)} invalid={(isSubmitted || driver.state) && !isValid("state", driver.state)} >
                                <option value="" disabled>-- Select State --</option>
                                {/* {Object.keys(Cities)?.map(state => <option value={Object.values(States)?.filter(item => item.trim.toLowerCase === state.trim.toLowerCase)[0] }>{state}</option>)} */}
                                {Object.keys(Cities)?.map(state => <option value={getStateVal(state)}>{state}</option>)}
                            </Input>
                            <FormFeedback>Provided state is invalid!</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col xs={2}>
                        <FormGroup>
                            <Label for="city">City *</Label>
                            <Input type="select" name="city" value={driver.city} onChange={(e) => { setDriver({ ...driver, city: e.target.value }) }} valid={isValid("city", driver.city)} invalid={(isSubmitted || driver.city) && !isValid("city", driver.city)} >
                                <option value="" disabled>-- Select City --</option>
                                {driver.state && Object.keys(States).includes(driver.state) && Object.keys(Cities).includes(States[driver.state]) && Cities[States[driver.state]]?.map(city => <option value={city}>{city}</option>)}
                            </Input>
                            <FormFeedback>Provided city is invalid!</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col>
                        <FormGroup>
                            <Label for="streetAddress">Street Address *</Label>
                            <Input name="streetAddress" value={driver.streetAddress} onChange={(e) => { setDriver({ ...driver, streetAddress: e.target.value }) }} valid={isValid("streetAddress", driver.streetAddress)} invalid={(isSubmitted || driver.streetAddress) && !isValid("streetAddress", driver.streetAddress)} />
                            <FormFeedback>Provided street address is invalid!</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col xs={2}>
                        <FormGroup>
                            <Label for="zip">Zip *</Label>
                            <Input name="zip" value={driver.zip} onChange={(e) => { setDriver({ ...driver, zip: e.target.value }) }} valid={isValid("zip", driver.zip)} invalid={(isSubmitted || driver.zip) && !isValid("zip", driver.zip)} />
                            <FormFeedback>Provided zip is invalid!</FormFeedback>
                        </FormGroup>
                    </Col>
                </Row>
                <br />
                <Row>
                    <Col>
                        <FormGroup>
                            <Label for="dmvLicense">DMV License *</Label>
                            <Input name="dmvLicense" value={driver.dmvLicense} onChange={(e) => { setDriver({ ...driver, dmvLicense: e.target.value }) }} valid={isValid("dmvLicense", driver.dmvLicense)} invalid={(isSubmitted || driver.dmvLicense) && !isValid("dmvLicense", driver.dmvLicense)} />
                            <FormFeedback>Provided DMV license is invalid!</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col>
                        <FormGroup>
                            <Label for="tlcLicense">TLC License *</Label>
                            <Input name="tlcLicense" value={driver.tlcLicense} onChange={(e) => { setDriver({ ...driver, tlcLicense: e.target.value }) }} valid={tlcValid} invalid={(isSubmitted || driver.tlcLicense) && !tlcValid} />
                            <FormFeedback>Provided TLC license is invalid!</FormFeedback>
                        </FormGroup>
                    </Col>
                </Row>
            </ModalBody>
            <ModalFooter>
                {error && <Badge color="danger" style={{ whiteSpace: "pre-line" }}>{error}</Badge>}
                <Button className="btn" color="secondary" onClick={() => handleClose()}>Cancel</Button>
                {loading ? <span>Loading...</span> : <Button className="btn" color="primary" onClick={() => { handleRegisterDriver(); }}>Register</Button>}
            </ModalFooter>
        </Modal>
    )
}

export default RegisterDriverModal
