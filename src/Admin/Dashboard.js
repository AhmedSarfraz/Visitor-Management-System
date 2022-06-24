import { Row, Col, Card, CardBody, CardTitle, CardSubtitle, Table, Input, Label, Modal, ModalBody, Button } from 'reactstrap';
import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement, } from 'chart.js';
import { Pie, Bar, Line, Doughnut } from 'react-chartjs-2';
import Colors from './Colors.json'
import moment from 'moment';
import "./Dashboard.css";

ChartJS.register(ArcElement, CategoryScale, BarElement, LinearScale, PointElement, LineElement, Tooltip, Legend, Title);

function Dashboard({ filteredAgents, filteredDrivers, allLanguages, allDepartments, setActivePath }) {
    const [showTablularView, setShowTablularView] = useState({
        weeklyStats: false,
        visitingStats: false,
        languageStats: false,
        agentStats: false,
    })
    
    const getDriversCountByStatus = (status = [], date, filteredDrivers) => {
        let drivers = status.length > 0 ? filteredDrivers?.filter(driver => status.includes(driver.status)) : filteredDrivers
        if (date)
            drivers = drivers?.filter(driver => moment(driver.dateAdded.toDate()).format(moment.HTML5_FMT.DATE) === moment(date).format(moment.HTML5_FMT.DATE))
        return drivers?.length
    }

    const getMedian = (param1, param2, valueBy, value, filteredDrivers) => {
        let timeArray = []
        filteredDrivers?.forEach(driver => {
            if (valueBy === "day" && driver[param1] && driver[param2] && moment(driver.dateAdded.toDate()).format("dddd") === value)
                timeArray.push(moment.duration(moment(driver[param1].toDate()).diff(moment(driver[param2].toDate()))).asMinutes())
            else if (valueBy && value && driver[valueBy] === value && driver[param1] && driver[param2])
                timeArray.push(moment.duration(moment(driver[param1].toDate()).diff(moment(driver[param2].toDate()))).asMinutes())
            else if (!valueBy && !value && driver[param1] && driver[param2])
                timeArray.push(moment.duration(moment(driver[param1].toDate()).diff(moment(driver[param2].toDate()))).asMinutes())
            // if (driver.department === dep && driver.completedAt && driver.acceptedAt && !agentId) {
            // timeArray.push(moment.duration(moment(driver[param1].toDate()).diff(moment(driver[param2].toDate()))).asMinutes())
            // }
            // if (driver.agent === agentId && driver.completedAt && driver.acceptedAt && !dep) {
            //     timeArray.push(moment.duration(moment(driver[param1].toDate()).diff(moment(driver[param2].toDate()))).asMinutes())
            // }
            // if (driver[param1] && driver[param2] && !agentId && !dep) {
            //     timeArray.push(moment.duration(moment(driver[param1].toDate()).diff(moment(driver[param2].toDate()))).asMinutes())
            // }
        })
        const mid = Math.floor(timeArray.length / 2),
            nums = [...timeArray].sort((a, b) => a - b);
        return (timeArray.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2).toFixed(0)
    }


    const getStatsByLanguage = (language, filteredDrivers) => {
        let count = 0;
        filteredDrivers?.map(driver => {
            if (driver && driver.language && driver.language === language && driver.status === "completed")
                count++
        })
        return count;
    }

    // const getBusiestDep = (date = null, filteredDrivers) => {
    //     let depArr = []
    //     filteredDrivers?.map((driver) => {
    //         if (driver.department && !date)
    //             depArr.push(driver.department)
    //         if (date && moment(driver.dateAdded.toDate()).format(moment.HTML5_FMT.DATE) === moment(date).format(moment.HTML5_FMT.DATE))
    //             depArr.push(driver.department)
    //     })
    //     let counts = depArr.reduce((a, b) => { a[b] = (a[b] || 0) + 1; return a }, {});
    //     let maxCount = Math.max(...Object.values(counts));
    //     let mostFrequent = Object.keys(counts).filter(k => counts[k] === maxCount);
    //     return mostFrequent.length > 0 ? mostFrequent : "No Ticket Found"
    // }

    const getDepartmentCountOnDays = (tickets, name) => {
        return moment.weekdays().map(weekDay => tickets?.filter(item => moment(item.dateAdded.toDate()).format("dddd") === weekDay && item.department === name).length)
    }

    const getDepartmentCountOnAgents = (tickets, name, allAgents) => {
        return allAgents?.map(agent => tickets?.filter(item => item.agent === agent.userPk && item.department === name && item.status === "completed").length)
    }


    const renderAgentStatsByDepChart = (tickets, allAgents) => {
        const options = {
            responsive: true,
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    stacked: true,
                },
            },
        };
        let agentsWithTickets = allAgents?.filter(agent => tickets.filter(ticket => ticket.agent === agent.userPk).length > 0)
        const data = {
            labels: agentsWithTickets?.map(agent => agent.username),
            datasets: allDepartments?.map((dept, i) => ({
                label: dept.name,
                data: getDepartmentCountOnAgents(tickets, dept.name, agentsWithTickets),
                backgroundColor: Colors["Departments"][i]
            }))
        }
        return <Bar data={data} options={options} />
    }

    const renderStatsByWeekdaysChart = (tickets, allDepartments) => {
        const options = {
            responsive: true,
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    stacked: true,
                },
            },
        };
        const data = {
            labels: moment.weekdays().map(weekDay => weekDay),
            datasets: allDepartments?.map((dept, i) => ({
                label: dept.name,
                data: getDepartmentCountOnDays(tickets, dept.name),
                backgroundColor: Colors["Departments"][i]
            }))
        }
        return <Bar data={data} options={options} />
    }

    const renderDepartmentsChart = (allDepartments, filteredDrivers) => {
        const data = {
            labels: allDepartments.map(dep => dep.name),
            datasets: [
                {
                    data: allDepartments.map(dep => filteredDrivers?.filter(item => dep.name === item.department).length),
                    backgroundColor: Colors["Departments"],
                    borderColor: Colors["Departments"],
                    borderWidth: 1,
                },
            ],
        }
        return <Pie data={data} />
    }

    const renderAverageTimes = (filteredDrivers) => {
        const options = {
            responsive: true,
            aspectRation: 1,
            plugins: {
                legend: {
                    position: 'top',
                },
            },
        };
        const data = {
            labels: moment.weekdays().map(weekDay => weekDay),
            datasets: [["completedAt", "dateAdded"], ["completedAt", "acceptedAt"], ["acceptedAt", "dateAdded"]].map((item, i) => ({
                label: i === 0 ? 'AVG Completion Time' : i === 1 ? 'AVG Serving Time' : 'AVG Waiting Time',
                data: moment.weekdays().map(weekDay => getMedian(item[0], item[1], "day", weekDay, filteredDrivers)),
                backgroundColor: Colors["Hassan_Departments"][i],
                borderColor: Colors["Hassan_Departments"][i],
                borderWidth: 4,
            }))
        }
        return <Line options={options} data={data} />;
    }

    const renderLanguageStatsChart = (allLanguages, filteredDrivers) => {
        const data = {
            labels: allLanguages.map(lang => lang.name),
            datasets: [
                {
                    label: 'AVG Completion Time',
                    data: allLanguages.map(lang => getStatsByLanguage(lang.name, filteredDrivers)),
                    backgroundColor: Colors["Languages"],
                    borderWidth: 0,
                },
            ],
        }
        return <Doughnut data={data} />;
    }

    useEffect(()=>{
        setActivePath("Dashboard")
    }, [])

    return (
        <div className="vms-dashboard-wrapper">
            <Row className="no-gutters">
                <Col>
                    <Card style={{backgroundColor: "transparent"}}>
                        <CardBody>
                            <CardTitle className="vms-dashboard-table-title pt-0">{getDriversCountByStatus(["waiting", "assigned", "completed"], new Date(), filteredDrivers)}</CardTitle>
                            <CardSubtitle tag="h6">CHECK-IN TODAY</CardSubtitle>
                        </CardBody>
                    </Card>
                </Col>
                <Col>
                    <Card style={{backgroundColor: "transparent"}}>
                        <CardBody>
                            <CardTitle className="vms-dashboard-table-title pt-0">{getDriversCountByStatus(["waiting"], null, filteredDrivers)}</CardTitle>
                            <CardSubtitle tag="h6">WAITING</CardSubtitle>
                        </CardBody>
                    </Card>
                </Col>
                <Col>
                    <Card style={{backgroundColor: "transparent"}}>
                        <CardBody>
                            <CardTitle className="vms-dashboard-table-title pt-0">{getDriversCountByStatus(["assigned"], null, filteredDrivers)}</CardTitle>
                            <CardSubtitle tag="h6">SERVING</CardSubtitle>
                        </CardBody>
                    </Card>
                </Col>
                <Col>
                    <Card style={{backgroundColor: "transparent"}}>
                        <CardBody>
                            {/* <CardTitle className="vms-dashboard-table-title pt-0">{getDriversCountByStatus(["completed"], filters.selection.endDate, filteredDrivers)}</CardTitle> */}
                            <CardTitle className="vms-dashboard-table-title pt-0">{getDriversCountByStatus(["completed"], new Date(), filteredDrivers)}</CardTitle>
                            <CardSubtitle tag="h6">SERVED TODAY</CardSubtitle>
                        </CardBody>
                    </Card>
                </Col>
                <Col>
                    <Card style={{backgroundColor: "transparent"}}>
                        <CardBody>
                            <CardTitle className="vms-dashboard-table-title pt-0">{getDriversCountByStatus(["completed"], null, filteredDrivers)}</CardTitle>
                            <CardSubtitle tag="h6">TOTAL SERVED</CardSubtitle>
                        </CardBody>
                    </Card>
                </Col>
                {/* <Col md="6" lg="3">
                 <Card>
                        <CardBody>
                            <CardSubtitle tag="h2">{getMedian("completedAt", "dateAdded", "", "", filteredDrivers)} </CardSubtitle>
                            <CardTitle tag="h6" >AVG COMPLETION TIME</CardTitle>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            <CardSubtitle tag="h2">{getMedian("completedAt", "acceptedAt", "", "", filteredDrivers)} </CardSubtitle>
                            <CardTitle tag="h6">AVG SERVING TIME</CardTitle>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            <CardSubtitle tag="h2">{getMedian("acceptedAt", "dateAdded", "", "", filteredDrivers)} </CardSubtitle>
                            <CardTitle tag="h6">AVG WAITING TIME</CardTitle>
                        </CardBody>
                    </Card> 
                {/* </Col> */}
            </Row>
            <Row className="no-gutters">
                <Col md="6" lg="3">
                    <Card>
                        <CardTitle className="vms-dashboard-table-title">
                            REASON STATS
                            <i className={"m-2 float-right " + (showTablularView.visitingStats ? "fa fa-chevron-left" : "fa fa-chevron-right")} aria-hidden="true" onClick={() => setShowTablularView({ ...showTablularView, visitingStats: showTablularView.visitingStats ? false : true })} />
                        </CardTitle>
                        <CardBody className="vms-dashboard-table-wrapper">
                            {!showTablularView.visitingStats ?
                                renderDepartmentsChart(allDepartments, filteredDrivers)
                                :
                                <Table responsive>
                                    <thead>
                                        <tr>
                                            <th >Visiting Reason</th>
                                            <th>Total Tickets</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allDepartments.map((dep, i) =>
                                            <tr className="text-capitalize" key={i}>
                                                <td> {dep.name} </td>
                                                <td> {filteredDrivers?.filter(item => dep.name === item.department).length} </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            }
                        </CardBody>
                    </Card>
                    {/* <Card>
                        <CardBody>
                            <CardSubtitle tag="h2">{getDriversCountByStatus(["waiting", "assigned", "completed"], new Date(), filteredDrivers)}</CardSubtitle>
                            <CardTitle tag="h6">CHECKED-IN TODAY</CardTitle>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            <CardSubtitle tag="h2" >{getBusiestDep("", filteredDrivers)}</CardSubtitle>
                            <CardTitle tag="h6" >BUSY DEPARTMENT</CardTitle>
                        </CardBody>
                    </Card> */}

                </Col>

                <Col md="12" lg="6">
                    <Card>
                        <CardTitle className="vms-dashboard-table-title">
                            VISITING REASON STATS BY WEEKDAYS
                            <i className={"m-2  float-right " + (showTablularView.weeklyStats ? "fa fa-chevron-left" : "fa fa-chevron-right")} aria-hidden="true" onClick={() => setShowTablularView({ ...showTablularView, weeklyStats: showTablularView.weeklyStats ? false : true })} />
                        </CardTitle>

                        <CardBody className="vms-dashboard-table-wrapper">
                            {!showTablularView.weeklyStats ? renderStatsByWeekdaysChart(filteredDrivers, allDepartments) :
                                <Table responsive>
                                    <thead>
                                        <tr>
                                            <th >Week Day</th>
                                            <th>Overall</th>
                                            <th>Last Week</th>
                                            <th>Current Week</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {moment.weekdays().map((weekDay, i) => <tr className="text-capitalize" key={i}>
                                            <td> <i className="fa fa-circle" aria-hidden="true" style={{ color: moment().day() === i ? "green" : "red" }} />&nbsp;&nbsp;{weekDay}</td>
                                            <td> {filteredDrivers?.filter(item => moment(item.dateAdded.toDate()).format("dddd") === weekDay).length} </td>
                                            <td> {filteredDrivers?.filter(item => moment(item.dateAdded.toDate()).format(moment.HTML5_FMT.DATE) > moment().subtract(1, 'weeks').startOf('week').format(moment.HTML5_FMT.DATE) && moment(item.dateAdded.toDate()).format(moment.HTML5_FMT.DATE) < moment().startOf("isoWeek").format(moment.HTML5_FMT.DATE) && moment(item.dateAdded.toDate()).format("dddd") === weekDay).length} </td>
                                            <td> {filteredDrivers?.filter(item => moment(item.dateAdded.toDate()).format(moment.HTML5_FMT.DATE) >= moment().startOf("isoWeek").format(moment.HTML5_FMT.DATE) && moment(item.dateAdded.toDate()).format(moment.HTML5_FMT.DATE) <= moment().format(moment.HTML5_FMT.DATE) && moment(item.dateAdded.toDate()).format("dddd") === weekDay).length} </td>
                                        </tr>)}
                                    </tbody>
                                </Table>}
                        </CardBody>
                    </Card>
                </Col>

                <Col xs="6" lg="3">
                    <Card>
                        <CardTitle className="vms-dashboard-table-title">LANGUAGE STATS
                            <i className={"m-2 float-right " + (showTablularView.languageStats ? "fa fa-chevron-left" : "fa fa-chevron-right")} aria-hidden="true" onClick={() => setShowTablularView({ ...showTablularView, languageStats: showTablularView.languageStats ? false : true })} />
                        </CardTitle>
                        <CardBody className="vms-dashboard-table-wrapper">
                            {!showTablularView.languageStats ? renderLanguageStatsChart(allLanguages, filteredDrivers) :
                                <Table responsive>
                                    <thead>
                                        <tr>
                                            <th >Language</th>
                                            <th>Total Served</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allLanguages?.map((language) => <tr className="text-capitalize" key={language}>
                                            <td> <i className="fa fa-circle" aria-hidden="true" style={{ color: language.status === "active" ? "green" : "red" }} />&nbsp;&nbsp;{language.name}</td>
                                            <td> {getStatsByLanguage(language.name, filteredDrivers)} </td>
                                        </tr>)}
                                        {allLanguages?.length === 0 && <tr><td colSpan={11}>No Language Found!</td></tr>}
                                    </tbody>
                                </Table>
                            }
                        </CardBody>
                        {/* <CardTitle className="vms-dashboard-table-title">LANGUAGES STATS</CardTitle>
                        <CardBody className="vms-dashboard-table-wrapper">
                        </CardBody> */}
                    </Card>
                </Col>
            </Row>
            <Row className="no-gutters">
                <Col xs="6">
                    <Card>
                        <CardTitle className="vms-dashboard-table-title">AVERAGE TIME BY WEEKDAYS</CardTitle>
                        <CardBody className="vms-dashboard-table-wrapper">
                            {renderAverageTimes(filteredDrivers)}
                        </CardBody>

                        {/* <CardTitle className="vms-dashboard-table-title">DEPARTMENT ENGAGEMENT</CardTitle>
                        <CardBody className="vms-dashboard-table-wrapper">
                            <Table responsive>
                                <thead>
                                    <tr>
                                        <th >Department</th>
                                        <th>Overall</th>
                                        <th>Last Week</th>
                                        <th>Current Week</th>
                                        <th>Currently Serving</th>
                                        <th>AVG Completion</th>
                                        <th>AVG Serving</th>
                                        <th>AVG Waiting</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allDepartments.map((dep, i) => <tr className="text-capitalize" key={i}>
                                        <td> <i className="fa fa-circle" aria-hidden="true" style={{ color: dep.status === "active" ? "green" : "red" }} />&nbsp;&nbsp;{dep.name}</td>
                                        <td> {filteredDrivers?.filter(item => dep.name === item.department).length} </td>
                                        <td> {filteredDrivers?.filter(item => moment(item.dateAdded.toDate()).format(moment.HTML5_FMT.DATE) > moment().subtract(1, 'weeks').startOf('week').format(moment.HTML5_FMT.DATE) && moment(item.dateAdded.toDate()).format(moment.HTML5_FMT.DATE) < moment().startOf("isoWeek").format(moment.HTML5_FMT.DATE) && dep.name === item.department).length} </td>
                                        <td> {filteredDrivers?.filter(item => moment(item.dateAdded.toDate()).format(moment.HTML5_FMT.DATE) >= moment().startOf("isoWeek").format(moment.HTML5_FMT.DATE) && moment(item.dateAdded.toDate()).format(moment.HTML5_FMT.DATE) <= moment().format(moment.HTML5_FMT.DATE) && dep.name === item.department).length} </td>
                                        <td> {filteredDrivers?.filter(item => dep.name === item.department && item.status === "assigned").length} </td>
                                        <td> {getMedian("completedAt", "dateAdded", "department", dep.name, filteredDrivers)} </td>
                                        <td> {getMedian("completedAt", "acceptedAt", "department", dep.name, filteredDrivers)} </td>
                                        <td> {getMedian("acceptedAt", "dateAdded", "department", dep.name, filteredDrivers)} </td>
                                    </tr>)}
                                    {allDepartments?.length === 0 && <tr><td colSpan={11}>No Department Found!</td></tr>}
                                </tbody>
                            </Table>
                        </CardBody> */}
                    </Card>
                </Col>
                <Col xs="6">
                    <Card>
                        <CardTitle className="vms-dashboard-table-title">
                            AGENT STATS
                            <i className={"m-2 float-right " + (showTablularView.agentStats ? "fa fa-chevron-left" : "fa fa-chevron-right")} aria-hidden="true" onClick={() => setShowTablularView({ ...showTablularView, agentStats: showTablularView.agentStats ? false : true })} />
                        </CardTitle>
                        <CardBody className="vms-dashboard-table-wrapper">
                            {!showTablularView.agentStats ?
                                renderAgentStatsByDepChart(filteredDrivers, filteredAgents)
                                :
                                <Table responsive >
                                    <thead>
                                        <tr>
                                            <th>Username</th>
                                            <th>Currently Serving</th>
                                            <th>Total Served</th>
                                            <th>Average Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAgents?.map(agent => <tr className="text-capitalize" key={agent.userPk}>
                                            <td> <i className="fa fa-circle" aria-hidden="true" style={{ color: agent.status === "active" ? "green" : "red" }} />&nbsp;&nbsp;{agent.username}</td>
                                            <td>
                                                {filteredDrivers?.filter(item => item.agent === agent.userPk && item.status === "assigned")?.length > 0 ? filteredDrivers?.filter(item => item.agent === agent.userPk && item.status === "assigned")[0].name : "--"}&nbsp;:&nbsp;
                                                {filteredDrivers?.filter(item => item.agent === agent.userPk && item.status === "assigned")?.length > 0 ? moment.duration(moment().diff(moment((filteredDrivers?.filter(item => item.agent === agent.userPk && item.status === "assigned")[0].acceptedAt.toDate())))).asMinutes().toFixed(0) : "--"} Minutes ago
                                            </td>
                                            <td> {filteredDrivers?.filter(item => item.agent === agent.userPk && item.status === "completed")?.length} </td>
                                            <td> {getMedian("completedAt", "acceptedAt", "agent", agent.userPk, filteredDrivers) === "NaN" ? "--" : getMedian("completedAt", "acceptedAt", "agent", agent.userPk, filteredDrivers)} </td>
                                        </tr>)}
                                        {filteredAgents?.length === 0 && <tr><td colSpan={11}>No Agent Found!</td></tr>}
                                    </tbody>
                                </Table>
                            }
                        </CardBody>
                    </Card>
                </Col>

            </Row>
            
        </div>
    )
}

export default Dashboard

