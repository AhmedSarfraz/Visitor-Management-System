import { useState } from 'react'
import { Container, Card, CardBody, Button, Row, Col, InputGroup, InputGroupAddon, InputGroupText, Input, Badge } from 'reactstrap';
import officeLogo from '../assets/office-logo.svg'
import loader from "../assets/loader.gif";
import { useMutation } from "@apollo/client";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, addPrefix } from '../firebase';
import gql from "graphql-tag";

const LOGIN_MUTATION = gql`mutation Login($username: String!, $password: String!){
    login(username:$username, password:$password){
        token
        user{
            id
            pk
            username
            groups{
                edges{
                    node{
                        name
                    }
                }
            }
        }
    }
}`;

function Login() {
    const [user, SetUser] = useState({ username: "", password: "" })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [LoginUser] = useMutation(LOGIN_MUTATION, {
        variables: {
            username: user.username,
            password: user.password
        },
        onError: (error) => { setError(error.message); setIsLoading(false); },
        onCompleted: async (response) => {
            if (response && response.login && response.login.token && !response.errors) {
                await localStorage.setItem('office_vms_user', response.login.token);
                let isAgent = true
                if(response.login.user && response.login.user.groups && response.login.user.groups.edges?.length > 0 && response.login.user.groups.edges.filter(item => item.node.name === "VMS-Admin")?.length>0)
                    isAgent = false
                await addUserInDb(response.login, isAgent)
                setIsLoading(false);
            } else {
                setError("Error: Something went wrong!")
                setIsLoading(false);
            }
        }
    });

    const addUserInDb = async (data, isAgent) => {
        try {
            await setDoc(doc(db, addPrefix("users"), String(data.user.pk)), {
                token: data.token,
                dateAdded: serverTimestamp(),
                userId: data.user.id,
                userPk: data.user.pk,
                username: data.user.username,
                status: isAgent ? "active" : "inactive",
                isAgent: isAgent,
            }, { merge: true });
            window.location.reload(false);
        } catch (err) {
            setError("Error: Unable to add user in database!")
        }
    }


    const handleLogin = () => {
        setIsLoading(true);
        LoginUser()
        return false
    }

    return (
        <Container fluid className="vms-checkin-container" >
            <Row>
                <Col md={{ size: 10, offset: 1 }} lg={{ size: 8, offset: 2 }} xl={{ size: 4, offset: 4 }} className="vms-checkin-wrapper">
                    <div className="bg-muted text-center p-4" style={{ borderRadius: "20px" }}>
                        <img src={officeLogo} alt="" />
                    </div>
                    {error && <Col xs={12} className="text-center pb-3"><Badge color="danger">{error}</Badge></Col>}
                    {isLoading &&<center> <img src={loader} alt="" width="100"  style={{zIndex:10000,marginBottom:-70,marginTop:10}}/></center>}
                    <Card>
                        <CardBody>
                            <h2 className="text-center mt-0" style={{ color: "black" }}><b>Admin login</b></h2>
                            <br />
                            <InputGroup>
                                <InputGroupAddon addonType="prepend">
                                    <InputGroupText><i className="fa fa-user" aria-hidden="true"></i></InputGroupText>
                                </InputGroupAddon>
                                <Input placeholder="BOS Username" value={user.username} onChange={(e) => SetUser({ ...user, username: e.target.value })} />
                            </InputGroup>
                            <br />
                            <InputGroup>
                                <InputGroupAddon addonType="prepend">
                                    <InputGroupText><i className="fa fa-lock" aria-hidden="true"></i></InputGroupText>
                                </InputGroupAddon>
                                <Input type="password" placeholder="Password" value={user.password} onChange={(e) => SetUser({ ...user, password: e.target.value })} />
                            </InputGroup>
                            <br />
                            <Button color="primary" className="float-right" onClick={() => handleLogin()}>Login</Button>
                        </CardBody>
                    </Card>
                </Col>
                <Col xs={7} className="vms-checkin-right-container">
                </Col>
            </Row>
        </Container>
    )
}

export default Login
