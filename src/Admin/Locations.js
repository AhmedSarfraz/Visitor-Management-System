import {useEffect, useState} from 'react'
import { Row, Col, Table, InputGroup, Input, InputGroupAddon, InputGroupText, Button, Badge, UncontrolledPopover, PopoverBody, PopoverHeader } from 'reactstrap';
import { collection, onSnapshot, query, serverTimestamp, addDoc, updateDoc, doc, where } from "firebase/firestore";
import { db, addPrefix } from '../firebase';
import moment from 'moment';

export default function Locations({locations, loadLocations, setActivePath}) {
    const [allLocations, setAllLocations] = useState(locations)
    const [filters, setFilters] = useState({status:""})
    const [newLoc, setNewLoc] = useState("")
    const [error, setError] = useState("")

    const updateLocStatus = async(locId, value) => {
        try {
          await updateDoc(doc(db, addPrefix("locations"), String(locId)), {
            "status" : value,
          });
          loadLocations()
          setError("")
        } catch (err) {
          setError("Error: Unable to update location in database!")
        }
    }

    const addNewLocation = async(name) => {
        try {
            await addDoc(collection(db, addPrefix("locations")), {
                name: name,
                status: "active",
                dateAdded: serverTimestamp(),
            });
            loadLocations()
            setError("")
        } catch (err) {
            setError("Error: Unable to update location in database!")
        }
    }

    useEffect(() => { 
        let allLocations = locations;
        if(filters.status) allLocations = allLocations.filter(location => location.status == filters.status);
        setAllLocations(allLocations)
    }, [filters, locations])

    useEffect(()=>{
        setActivePath("Locations")
    }, [])

    return (
        <Row className="no-gutters p-5">
            <Col>
                <Row className="vms-filters-wrapper no-gutters">
                    <Col xs={{size:3}}>
                        <Button onClick={()=>setNewLoc("")} id="addLocationPopover"> <i className="fa fa-plus" aria-hidden="true" />&nbsp;&nbsp;Add New</Button>
                        <UncontrolledPopover  placement="right" target="addLocationPopover">
                            <PopoverHeader>Add New Agent Location</PopoverHeader>
                            <PopoverBody>
                                <InputGroup>
                                    <Input value={newLoc} placeholder="New Location Name" onChange={(e)=>setNewLoc(e.target.value)} />
                                </InputGroup>
                                <Button color="primary" className="my-3 float-right" onClick={()=>addNewLocation(newLoc)}><i className="fa fa-plus" aria-hidden="true" />&nbsp;&nbsp;Add Location</Button>
                            </PopoverBody>
                        </UncontrolledPopover>
                    </Col>
                    <Col xs={{size:3, offset:6}}>
                        <InputGroup>
                            <Input type="select" value={filters.status} onChange={(e)=>setFilters({...filters, status:e.target.value})}>
                                <option value="">-- Filter by Status --</option>
                                {["active", "inactive"]?.map(item=><option value={item}>{item}</option>)}
                            </Input>
                            <InputGroupAddon addonType="append">
                                <InputGroupText><i className="fa fa-search" aria-hidden="true"></i></InputGroupText>
                            </InputGroupAddon>
                        </InputGroup>
                    </Col>
                </Row>
                <Row className="no-gutters">
                    {error && <Badge color="danger" className="p-3">{error}</Badge>}
                    <Col className="vms-table-wrapper">
                        <Table responsive className="vms-table vms-table-queue">
                            <thead>
                                <tr>
                                    <th>Location Name</th>
                                    <th>Is Active</th>
                                    <th>Date Added</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allLocations?.map(location=><tr className="text-capitalize">
                                    <td><i className="fa fa-circle" aria-hidden="true" style={{color:location.status === "active" ? "green" : "red"}} />&nbsp;&nbsp;{location.name}</td>
                                    <td>{location.status} </td>
                                    <td>{location.dateAdded?moment(location.dateAdded.toDate()).format('lll'):"--"} </td>
                                    <td> <Button color={location.status === "active" ? "primary" : "secondary"} onClick={()=>updateLocStatus(location.firebaseId, location.status==="active" ? "inactive" : "active", false)}>Make Location {location.status === "active" ? "Inactive" : "Active"}</Button> </td>
                                </tr>)}
                                {allLocations?.length===0 && <tr><td colSpan={11}>No Location Found!</td></tr>}
                            </tbody>
                        </Table>
                    </Col>
                </Row>
                <Row className="no-gutters pt-5">
                    <Col xs={12}>
                        <i className="fa fa-circle" aria-hidden="true" style={{color: "red"}} /> <b>&nbsp;&nbsp;Location not is use</b>
                    </Col>
                    <Col xs={12}>
                        <i className="fa fa-circle" aria-hidden="true" style={{color: "green"}} /> <b>&nbsp;&nbsp;Active Location</b>
                    </Col>
                    <Col xs={12}>
                        <i className="fa fa-circle" aria-hidden="true" style={{color: "black"}} /> <b>&nbsp;&nbsp;Undefined status</b>
                    </Col>
                </Row>
            </Col>
        </Row>
    )
}
