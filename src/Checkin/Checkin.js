import { useState, useEffect } from 'react'
import { useQuery } from '@apollo/client';
import { Container, Card, CardBody, Button, Row, Label, FormGroup, Col, InputGroup, InputGroupAddon, InputGroupText, Input, Badge } from 'reactstrap';
import gql from 'graphql-tag';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from "firebase/firestore";
import { db, addPrefix } from '../firebase';
import parsePhoneNumber from 'libphonenumber-js'
import driverPlaceholder from '../assets/placeholder.png'
import officeLogo from '../assets/office-logo.svg'
import Select from 'react-select';
import RegisterDriverModal from './RegisterDriverModal';
import './Checkin.css'

const DRIVER_QUERY = gql`query Driver($phone: String, $email: String) {
    driver(phone:$phone, email:$email){
        id
        pk
        name
        email
        phone
        tlcLicense
        balance
        tags{
            name
        }
        reservationDriver(status:"Open"){
            edges {
                node {
                    id
                    pickupDate
                    car{
                        id
                        pk
                        model
                        year
                        dmvPlate
                    }
                }
            }
        }
        currentAgreement{
            id
            stage
            startDate
            endDate
            car {
                id
                pk
                model
                year
                dmvPlate
            }
        }
    }
}`;

function Checkin({activeDrivers}) {
    const [usePhone, setUsePhone] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [activeStep, setActiveStep] = useState("existingUser")
    const [driver, setDriver] = useState({})
    const [selection, setSelection] = useState({ dept: "", reasons: [], lang: "", notes: "" })
    const [allLanguages, setAllLanguages] = useState([])
    const [allReasons, setAllReasons] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const validateInput = (input = searchTerm) => {
        if (usePhone) {
            if (input.length < 10) return false
            if (!input.includes("+1")) input = "+1" + input

            if (parsePhoneNumber(input)?.isValid()) return true
            else return false
        } else {
            let re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(String(input).toLowerCase());
        }
    }

    const { refetch } = useQuery(DRIVER_QUERY, {
        skip: !validateInput(searchTerm),
        variables: { phone: usePhone ? (searchTerm.includes("+1") ? searchTerm : ("+1" + searchTerm)) : null, email: usePhone ? null : searchTerm },
        fetchPolicy: "network-only",
        notifyOnNetworkStatusChange: true,
        onError: (error) => { setError(error); setDriver({}); setIsLoading(false)},
        onCompleted: async (data) => {
            if (data && data.driver && data.driver.id) {
                setError("")
                await setDriver(data.driver)
            } else {
                setError("Error: System didn't find any driver based on this information, Please sign up as a new user or regiser by using the link we have send you!")
                await setDriver({})
            }
        }
    });

    useEffect(() => {
        const locRef = collection(db, addPrefix("departments"));
        let querySet = query(locRef)
        querySet = query(querySet, where("status", "==", "active"));
        const unsubscribe = onSnapshot(querySet, (querySnapshot) => {
            let locArr = []
            querySnapshot.forEach((doc) => {
                locArr.push({ ...doc.data(), firebaseId: doc.id });
            });
            setAllReasons(locArr)
        });
        return () => unsubscribe()
    }, [])

    useEffect(() => {
        const langRef = collection(db, addPrefix("languages"));
        let querySet = query(langRef)
        querySet = query(querySet, where("status", "==", "active"));
        const unsubscribe = onSnapshot(querySet, (querySnapshot) => {
            let langArr = []
            querySnapshot.forEach((doc) => {
                langArr.push({ ...doc.data(), firebaseId: doc.id });
            });
            setAllLanguages(langArr)
        });
        return () => unsubscribe()
    }, [])

    const addDriverInQueue = async () => {
        if (driver) {
            try {
                if (activeDrivers.filter(ticket => (["waiting", "assigned"].includes(ticket.status) && ticket.driverId == driver.id)).length > 0) {
                    setSearchTerm("")
                    setError('Error: You are already in the queue, please wait for your turn!')
                    return
                }
                await addDoc(collection(db, addPrefix("tickets")), {
                    driverId: driver.id,
                    pk: driver.pk,
                    phone: driver.phone,
                    email: driver.email,
                    name: driver.name,
                    tlcLicense: driver.tlcLicense,
                    status: "waiting",
                    language: selection.lang,
                    notes: selection.notes ? selection.notes : "",
                    department: selection.dept,
                    reasons: selection.reasons,
                    balance: driver.balance,
                    tags: driver.tags?.map(tag => tag.name),
                    dateAdded: serverTimestamp(),
                });
                setSearchTerm("")
                setSelection({ dept: "", reasons: [] })
                setDriver({})
            } catch (err) {
                setSearchTerm("")
                setError("Error: While adding driver in queue, please contact admin!")
            }
        } else {
            setSearchTerm("")
            setError("Error: No Driver has been selected!")
        }
    }

    const sendRegistrationLink = () => {
        setIsLoading(true);
        fetch(`${process.env.REACT_APP_MESSENGER_API}/Message`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: searchTerm ? searchTerm : '',
                from: '+18885248449',
                body: 'To better assist you, can you please fill out this application? \n \nHere is the link: https://office-us.uc.r.appspot.com/?source=FrontOffice',
                Subject: 'Office VMS'
            })
        }).then((response) => {
            if (response && response.status && response.status === 200)
                setIsLoading(false)
        }).catch((error) => {
            setIsLoading(false)
            setError("Error while sending a message. Please try again!")
        });
    }

    useEffect(() => {
        setError("");
        if (activeStep === "thankyou") {
            addDriverInQueue();
        }
    }, [activeStep])
    let isInputValid = validateInput()

    return (
        <Container fluid className="vms-checkin-container">
            <Row>
                <Col md={{ size: 12, offset: 0 }} md={{ size: 10, offset: 1 }} lg={{ size: 8, offset: 2 }} xl={{ size: 6, offset: 3 }} className="vms-checkin-wrapper">
                    {["welcome", "existingUser", "registerDriver"].includes(activeStep) &&
                        <><div className="bg-muted text-center p-4" style={{ borderRadius: "20px" }}>
                            <img src={officeLogo} alt="" />
                        </div>
                            <h2>Welcome to <strong>Buggy TLC</strong> </h2></>
                    }
                    {isLoading && "Loading ..."}
                    {error && <Col xs={12} className="text-center pb-3"><Badge color="danger" style={{ whiteSpace: "pre-wrap", lineHeight: "25px", textAlign: "left" }}>{error}</Badge></Col>}
                    {activeStep === "welcome" ?
                        <Card>
                            <CardBody>
                                <span>is this your first time visiting office?</span>
                                <div className="pt-4">
                                    <Button color="secondary" onClick={() => setActiveStep("newUser")} disabled>No</Button>&nbsp;&nbsp;&nbsp;&nbsp;
                                    <Button color="primary" onClick={() => setActiveStep("existingUser")}>Yes</Button>
                                </div>
                            </CardBody>
                        </Card>
                        : activeStep === "existingUser" || activeStep === "registerDriver" ?
                            <Card>
                                {activeStep === "registerDriver" && <RegisterDriverModal open={activeStep === "registerDriver"} handleClose={() => setActiveStep("existingUser")} input={searchTerm} setSearchTerm={setSearchTerm} refetchDriver={refetch} driverData={driver} handleNext={() => setActiveStep("askReason")} isPhone={usePhone} />}
                                {/* <span className="vms-checkin-go-back-link" onClick={()=>setActiveStep("welcome")}><i className="fa fa-arrow-left" aria-hidden="true" />&nbsp;&nbsp;Go Back</span> */}
                                <CardBody>
                                    <Label>Enter your phone number to check in</Label>
                                    <InputGroup>
                                        <InputGroupAddon addonType="prepend">
                                            <InputGroupText><i className={usePhone ? "fa fa-phone" : "fa fa-envelope"} aria-hidden="true"></i></InputGroupText>
                                        </InputGroupAddon>
                                        <Input type={usePhone ? "tel" : "email"} placeholder={usePhone ? "347-334-6313" : "john_doe@joinoffice.com"} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                    </InputGroup>
                                    <FormGroup check className="pt-4">
                                        <Label check>
                                            <Input type="checkbox" checked={!usePhone} onChange={() => { setUsePhone(!usePhone); setSearchTerm(""); }} />{' '}Use {usePhone ? "Email" : "Phone"} Instead</Label>
                                    </FormGroup>
                                    <div>
                                        {isInputValid && (driver && driver.id ?
                                            <Button color="primary" onClick={() => { setActiveStep("askReason") }} className="float-right">Check in</Button>
                                            : <Row>
                                                <Col xs={6}>
                                                    <Button color="primary" onClick={() => { sendRegistrationLink() }} className="float-right">Send Link</Button>
                                                </Col>
                                                <Col xs={6}>
                                                    <Button color="primary" onClick={() => { setActiveStep("registerDriver") }} className="float-left">Sign Up</Button>
                                                </Col>
                                            </Row>
                                        )}
                                    </div>
                                </CardBody>
                            </Card>
                            : activeStep === "askReason" ?
                                <Card className="mt-0 p-4">
                                    <span className="vms-checkin-go-back-link" onClick={() => setActiveStep("existingUser")}><i className="fa fa-arrow-left" aria-hidden="true" />&nbsp;&nbsp;Go Back</span>
                                    <CardBody className="vms-checkin-driver-info">
                                        <Row>
                                            <Col xs={3}>
                                                <div className="vms-avatar">
                                                    <img src={driverPlaceholder} className="w-100" alt="" />
                                                </div>
                                            </Col>
                                            <Col xs={{ size: 8, offset: 1 }}>
                                                <h4>{driver && driver.name ? driver.name : "--"}</h4>
                                                <p className="muted-text pt-2"><b>Email: </b>{driver && driver.email ? driver.email : "--"}</p>
                                                <p className="muted-text"><b>Phone: </b>{driver && driver.phone ? driver.phone : "--"}</p>
                                                <p className="muted-text"><b>TLC: </b>{driver && driver.tlcLicense ? driver.tlcLicense : "--"}</p>
                                                <p className="muted-text"><b>Balance: </b>{driver && driver.balance ? driver.balance : "--"}</p>
                                            </Col>
                                        </Row>
                                        <Row className="pb-3">
                                            <Col xs={{ size: 8,offset:4 }}>
                                                    {driver && driver.tags && driver.tags.map((tag, i) =>
                                                        <span key={i}><span style={{fontSize:15,backgroundColor:'#393e5c',color:"white",padding:5}}>{tag.name}</span> </span>
                                                    )}
                                            </Col>
                                        </Row>
                                        {/* <Row>
                                            <Col xs={6}><Row className="bg-muted p-3 my-4 mx-1" style={{ borderRadius: "25px" }}>
                                                <Col xs={12} className="pb-4"><b>Current Rental Details</b></Col>
                                                {driver.currentAgreement && driver.currentAgreement.id ? <>
                                                    <Col xs={6}>
                                                        <Label className="pb-1"><i className="fa fa-calendar-o" aria-hidden="true" />&nbsp;&nbsp;Start Date</Label>
                                                        <p>{driver.currentAgreement.startDate ? moment(driver.currentAgreement.startDate).format('lll') : "--"}</p>
                                                    </Col>
                                                    <Col xs={6}>
                                                        <Label className="pb-1"><i className="fa fa-car" aria-hidden="true" />&nbsp;&nbsp;Car Plate</Label>
                                                        <p>{driver.currentAgreement.car && driver.currentAgreement.car.dmvPlate ? driver.currentAgreement.car.dmvPlate : "--"}</p>
                                                    </Col>
                                                    <br /><br />
                                                    <Col xs={6}>
                                                        <Label className="pb-1"><i className="fa fa-car" aria-hidden="true" />&nbsp;&nbsp;Car Model</Label>
                                                        <p>{driver.currentAgreement.car && driver.currentAgreement.car.model ? driver.currentAgreement.car.model : "--"}</p>
                                                    </Col>
                                                    <Col xs={6}>
                                                        <Label className="pb-1"><i className="fa fa-car" aria-hidden="true" />&nbsp;&nbsp;Car Year</Label>
                                                        <p>{driver.currentAgreement.car && driver.currentAgreement.car.year ? driver.currentAgreement.car.year : "--"}</p>
                                                    </Col>
                                                </> : <Col>No Active Rental Found!</Col>}
                                            </Row></Col>
                                            <Col xs={6}><Row className="bg-muted p-3 my-4 mx-1" style={{ borderRadius: "25px" }}>
                                                <Col xs={12} className="pb-4"><b>Current Reservation Details</b></Col>
                                                {driver.reservationDriver && driver.reservationDriver.edges?.length > 0 && driver.reservationDriver.edges[0].node ? <>
                                                    <Col xs={6}>
                                                        <Label className="pb-1"><i className="fa fa-calendar-o" aria-hidden="true" />&nbsp;&nbsp;Pickup Date</Label>
                                                        <p>{driver.reservationDriver.edges[0].node.pickupDate ? moment(driver.reservationDriver.edges[0].node.pickupDate).format('lll') : "--"}</p>
                                                    </Col>
                                                    <Col xs={6}>
                                                        <Label className="pb-1"><i className="fa fa-car" aria-hidden="true" />&nbsp;&nbsp;Car Plate</Label>
                                                        <p>{driver.reservationDriver.edges[0].node.car && driver.reservationDriver.edges[0].node.car.dmvPlate ? driver.reservationDriver.edges[0].node.car.dmvPlate : "--"}</p>
                                                    </Col>
                                                    <br /><br />
                                                    <Col xs={6}>
                                                        <Label className="pb-1"><i className="fa fa-car" aria-hidden="true" />&nbsp;&nbsp;Car Model</Label>
                                                        <p>{driver.reservationDriver.edges[0].node.car && driver.reservationDriver.edges[0].node.car.model ? driver.reservationDriver.edges[0].node.car.model : "--"}</p>
                                                    </Col>
                                                    <Col xs={6}>
                                                        <Label className="pb-1"><i className="fa fa-car" aria-hidden="true" />&nbsp;&nbsp;Car Year</Label>
                                                        <p>{driver.reservationDriver.edges[0].node.car && driver.reservationDriver.edges[0].node.car.year ? driver.reservationDriver.edges[0].node.car.year : "--"}</p>
                                                    </Col>
                                                </> : <Col>No Open Reservation Found!</Col>}
                                            </Row></Col>
                                        </Row> */}
                                        <Row>
                                            <Col xs={6}>
                                                <FormGroup>
                                                    <Label>Select Preferred Language *</Label>
                                                    <Select className="vms-custom-select" classNamePrefix="vms-select" options={allLanguages?.map(item => ({ value: item.name, label: item.name }))} placeholder="Select Your Preffered Language" onChange={(lang) => setSelection({ ...selection, lang: lang ? lang.value : null })} />
                                                </FormGroup>

                                            </Col>
                                            <Col xs={6}>
                                                <FormGroup>
                                                    <Label>Select Reason *</Label>
                                                    <Select className="vms-custom-select" classNamePrefix="vms-select" options={allReasons?.map(item => ({ value: item.name, label: item.name }))} placeholder="Select Reason To Visit" onChange={(dept) => setSelection({ ...selection, dept: dept ? dept.value : null })} />
                                                </FormGroup>
                                            </Col>
                                            <Col xs={6}>
                                                <FormGroup>
                                                    <Label>Reason Sub Category</Label>
                                                    <Select className="vms-custom-select" classNamePrefix="vms-select" options={allReasons?.filter(item => item.name === selection.dept)[0]?.reasons?.map(item => ({ value: item, label: item }))} placeholder="Select Category" isMulti onChange={reasons => setSelection({ ...selection, reasons: (reasons.map(item => item.value)) })} />
                                                </FormGroup>
                                            </Col>
                                            <Col xs={6}>
                                                <FormGroup>
                                                    <Label>Notes</Label>
                                                    <Input type="textarea" placeholder="Notes" onChange={(e) => setSelection({ ...selection, notes: e.target.value })} />
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                        <Row className="pt-4">
                                            <Button color="primary" className="float-right" onClick={() => { selection.lang && selection.dept ? setActiveStep("thankyou") : setError("Error: Preferred Language & Department for check-in are required field!") }}>Confirm Check in</Button>
                                        </Row>
                                    </CardBody>
                                </Card>
                                : activeStep === "thankyou" ?
                                    <>
                                        <Card className="bg-blue color-white vms-checkin-thank-you">
                                            <CardBody>
                                                <h3 className="text-center color-white"><strong>{error ? "Sorry!" : "Thank You!"}</strong> </h3>
                                                <p className={"text-center" + (error ? " text-danger" : "")}>{error ? error : "We will notify you when it's your turn"}</p>
                                            </CardBody>
                                        </Card>
                                        <div className="pt-4">
                                            <Button color="primary" className="float-right" onClick={() => setActiveStep("existingUser")}>Back To Check In</Button>
                                        </div>
                                    </> :
                                    ""
                    }
                </Col>
            </Row>
        </Container>
    )
}

export default Checkin
