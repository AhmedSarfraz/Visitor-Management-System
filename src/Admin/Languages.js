import {useEffect, useState} from 'react'
import { Row, Col, Table, InputGroup, Input, InputGroupAddon, InputGroupText, Button, Badge, UncontrolledPopover, PopoverBody, PopoverHeader } from 'reactstrap';
import { collection, onSnapshot, query, serverTimestamp, addDoc, updateDoc, doc, where } from "firebase/firestore";
import { db, addPrefix } from '../firebase';
import moment from 'moment';

export default function Languages({languages, loadLanguages, setActivePath}) {
    const [allLanguages, setAllLanguages] = useState(languages)
    const [filters, setFilters] = useState({status:""})
    const [newLoc, setNewLoc] = useState("")
    const [error, setError] = useState("")

    const updateLocStatus = async(locId, value) => {
        try {
          await updateDoc(doc(db, addPrefix("languages"), String(locId)), {
            "status" : value,
          });
          loadLanguages()
          setError("")
        } catch (err) {
          setError("Error: Unable to update language in database!")
        }
    }

    const addNewLang = async(name) => {
        try {
            await addDoc(collection(db, addPrefix("languages")), {
                name: name,
                status: "active",
                dateAdded: serverTimestamp(),
            });
            loadLanguages()
            setError("")
        } catch (err) {
            setError("Error: Unable to update language in database!")
        }
    }

    useEffect(() => { 
        let allLanguages = languages;
        if(filters.status) allLanguages = allLanguages.filter(lang => lang.status == filters.status);
        setAllLanguages(allLanguages)
    }, [filters, languages])

    useEffect(()=>{
        setActivePath("Languages")
    }, [])

    return (
        <Row className="no-gutters p-5">
            <Col>
                <Row className="vms-filters-wrapper no-gutters">
                    <Col xs={{size:3}}>
                        <Button onClick={()=>setNewLoc("")} id="addLanguagePopover"> <i className="fa fa-plus" aria-hidden="true" />&nbsp;&nbsp;Add New</Button>
                        <UncontrolledPopover  placement="right" target="addLanguagePopover">
                            <PopoverHeader>Add New Language</PopoverHeader>
                            <PopoverBody>
                                <InputGroup>
                                    <Input value={newLoc} placeholder="New Language Name" onChange={(e)=>setNewLoc(e.target.value)} />
                                </InputGroup>
                                <Button color="primary" className="my-3 float-right" onClick={()=>addNewLang(newLoc)}><i className="fa fa-plus" aria-hidden="true" />&nbsp;&nbsp;Add Language</Button>
                            </PopoverBody>
                        </UncontrolledPopover>
                    </Col>
                    <Col xs={{size:3, offset:6}}>
                        <InputGroup>
                            <Input type="select" value={filters.status} onChange={(e)=>setFilters({...filters, status:e.target.value})}>
                                <option value="">-- Filter by Status --</option>
                                {["active", "inactive"]?.map((item,i)=><option value={item} key={i}>{item}</option>)}
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
                                    <th>Language Name</th>
                                    <th>Is Active</th>
                                    <th>Date Added</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allLanguages?.map((language, i)=><tr className="text-capitalize" key={i}>
                                    <td><i className="fa fa-circle" aria-hidden="true" style={{color:language.status === "active" ? "green" : "red"}} />&nbsp;&nbsp;{language.name}</td>
                                    <td>{language.status} </td>
                                    <td>{language.dateAdded?moment(language.dateAdded.toDate()).format('lll'):"--"} </td>
                                    <td> <Button color={language.status === "active" ? "primary" : "secondary"} onClick={()=>updateLocStatus(language.firebaseId, language.status==="active" ? "inactive" : "active", false)}>Make Language {language.status === "active" ? "Inactive" : "Active"}</Button> </td>
                                </tr>)}
                                {allLanguages?.length===0 && <tr><td colSpan={11}>No Language Found!</td></tr>}
                            </tbody>
                        </Table>
                    </Col>
                </Row>
                <Row className="no-gutters pt-5">
                    <Col xs={12}>
                        <i className="fa fa-circle" aria-hidden="true" style={{color: "red"}} /> <b>&nbsp;&nbsp;Language not is use</b>
                    </Col>
                    <Col xs={12}>
                        <i className="fa fa-circle" aria-hidden="true" style={{color: "green"}} /> <b>&nbsp;&nbsp;Active Language</b>
                    </Col>
                    <Col xs={12}>
                        <i className="fa fa-circle" aria-hidden="true" style={{color: "black"}} /> <b>&nbsp;&nbsp;Undefined status</b>
                    </Col>
                </Row>
            </Col>
        </Row>
    )
}
