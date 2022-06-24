import {useEffect, useState} from 'react'
import { Row, Col, Table, InputGroup, Input, InputGroupAddon, InputGroupText, Button, Badge, Popover, PopoverBody, PopoverHeader } from 'reactstrap';
import { collection, onSnapshot, query, serverTimestamp, addDoc, updateDoc, doc, where, arrayUnion, arrayRemove } from "firebase/firestore";
import { db, addPrefix } from '../firebase';
import moment from 'moment';

export default function Department({departments, loadDepartments, setActivePath}) {
    const [allDepartments, setAllDepartments] = useState(departments)
    const [allReasons, setAllReasons] = useState([])

    const [filters, setFilters] = useState({status:""})
    const [newDept, setNewDept] = useState("")
    const [newReason, setNewReason] = useState("")
    const [error, setError] = useState("")
    const [popoverOpen, setPopoverOpen] = useState(false)

    const updateDeptStatus = async(deptId, value) => {
        try {
          await updateDoc(doc(db, addPrefix("departments"), String(deptId)), {
            "status" : value,
          });
          loadDepartments();
          setError("")
        } catch (err) {
          setError("Error: Unable to update Department in database!")
        }
    }
    
    const addNewReason = async(deptId, value) => {
        try {
            const deptRef = doc(db, addPrefix("departments"), String(deptId));
            await updateDoc(deptRef, {
                reasons: arrayUnion(value)
            })
            loadDepartments();
          setError("")
        } catch (err) {
          setError("Error: Unable to add reason in database!")
        }
    }

    const deleteReason = async(deptId, value) => {
        try {
            const deptRef = doc(db, addPrefix("departments"), String(deptId));
            await updateDoc(deptRef, {
                reasons: arrayRemove(value)
            })
            loadDepartments();
            setError("")
        } catch (err) {
          setError("Error: Unable to add reason in database!")
        }
    }
    
    const addNewDept = async(name) => {
        try {
            await addDoc(collection(db, addPrefix("departments")), {
                name: name,
                status: "active",
                dateAdded: serverTimestamp(),
            });
            loadDepartments();
            setError("")
        } catch (err) {
            setError("Error: Unable to update Department in database!")
        }
    }

    useEffect(() => { 
        let allDepartments = departments;
        if(filters.status) allDepartments = allDepartments.filter(department => department.status == filters.status);
        setAllDepartments(allDepartments)
    }, [filters, departments])
    
    useEffect(() => {
        let reasonsArr=[] 
        allDepartments?.forEach(item => item?.reasons?.forEach(reason => reasonsArr.push({value: reason, department: item.name, departmentId: item.firebaseId})))
        setAllReasons(reasonsArr)
    }, [allDepartments])

    useEffect(()=>{
        setActivePath("Reasons")
    }, [])

    return (
        <Row className="no-gutters p-5">
            <Col>
                <Row className="vms-filters-wrapper no-gutters">
                    <Col xs={{size:3}}>
                        <Button onClick={()=>{setNewDept(""); setPopoverOpen("addDepartmentPopover")}} id="addDepartmentPopover"> <i className="fa fa-plus" aria-hidden="true" />&nbsp;&nbsp;Add New</Button>
                        <Popover placement="right" target="addDepartmentPopover" isOpen={popoverOpen==="addDepartmentPopover"} toggle={()=>setPopoverOpen("")}>
                            <PopoverHeader>Add New Reason <i className="fa fa-times float-right" aria-hidden="true" onClick={()=>setPopoverOpen("")} /></PopoverHeader>
                            <PopoverBody>
                                <InputGroup>
                                    <Input value={newDept} placeholder="New Reason" onChange={(e)=>setNewDept(e.target.value)} />
                                </InputGroup>
                                <Button color="primary" className="my-3 float-right" onClick={()=>addNewDept(newDept)}><i className="fa fa-plus" aria-hidden="true" />&nbsp;&nbsp;Add Reason</Button>
                            </PopoverBody>
                        </Popover>
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
                    <Col xs={5} className="vms-table-wrapper">
                        <Table responsive className="vms-table vms-table-queue">
                            <thead>
                                <tr>
                                    <th>Reason</th>
                                    <th>Is Active</th>
                                    <th>Date Added</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allDepartments?.map(department=><tr className="text-capitalize">
                                    <td><i className="fa fa-circle" aria-hidden="true" style={{color:department.status === "active" ? "green" : "red"}} />&nbsp;&nbsp;{department.name}</td>
                                    <td>{department.status} </td>
                                    <td>{department.dateAdded?moment(department.dateAdded.toDate()).format('lll'):"--"} </td>
                                    <td> 
                                        <Button color={department.status === "active" ? "primary" : "secondary"} onClick={()=>updateDeptStatus(department.firebaseId, department.status==="active" ? "inactive" : "active", false)}>Make {department.status === "active" ? "Inactive" : "Active"}</Button> 
                                        &nbsp;&nbsp;&nbsp;&nbsp;<Button id={"addReasonPopover"+department.firebaseId} onClick={()=>{setNewReason(""); setPopoverOpen("addReasonPopover"+department.firebaseId)}}>Create Category</Button>
                                        <Popover placement="left" target={"addReasonPopover"+department.firebaseId} isOpen={popoverOpen==="addReasonPopover"+department.firebaseId} toggle={()=>setPopoverOpen("")}>
                                            <PopoverHeader>Add New Category for {department.name} <i className="fa fa-times float-right" aria-hidden="true" onClick={()=>setPopoverOpen("")} /></PopoverHeader>
                                            <PopoverBody>
                                                <InputGroup>
                                                    <Input value={newReason} placeholder="Category description" onChange={(e)=>setNewReason(e.target.value)} />
                                                </InputGroup>
                                                <Button color="primary" className="my-3 float-right" onClick={()=>addNewReason(department.firebaseId, newReason)}><i className="fa fa-plus" aria-hidden="true" />&nbsp;&nbsp;Add Reason</Button>
                                            </PopoverBody>
                                        </Popover>
                                    </td>
                                </tr>)}
                                {allDepartments?.length===0 && <tr><td colSpan={11}>No Reason Found!</td></tr>}
                            </tbody>
                        </Table>
                    </Col>
                    <Col xs={{size:6, offset:1}} className="vms-table-wrapper">
                        <Table responsive className="vms-table vms-table-queue">
                            <thead>
                                <tr>
                                    <th>Category Description</th>
                                    <th>Parent Reason</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allReasons?.map(reason=><tr className="text-capitalize">
                                    <td>{reason.value}</td>
                                    <td>{reason.department} </td>
                                    <td> 
                                        <Button color={"primary"} onClick={()=>deleteReason(reason.departmentId, reason.value)}>Delete</Button> 
                                    </td>
                                </tr>)}
                                {allReasons?.length===0 && <tr><td colSpan={11}>No Reason Found!</td></tr>}
                            </tbody>
                        </Table>
                    </Col>
                </Row>
                <Row className="no-gutters pt-5">
                    <Col xs={12}>
                        <i className="fa fa-circle" aria-hidden="true" style={{color: "red"}} /> <b>&nbsp;&nbsp;In-Active Reason</b>
                    </Col>
                    <Col xs={12}>
                        <i className="fa fa-circle" aria-hidden="true" style={{color: "green"}} /> <b>&nbsp;&nbsp;Active Reason</b>
                    </Col>
                    <Col xs={12}>
                        <i className="fa fa-circle" aria-hidden="true" style={{color: "black"}} /> <b>&nbsp;&nbsp;Undefined status</b>
                    </Col>
                </Row>
            </Col>
        </Row>
    )
}
