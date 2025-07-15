"use client";

import {useEffect, useState} from "react";
import RequestHelper from "@/helpers/RequestHelper";
import {ToastHelper} from "@/helpers/ToastHelper";
import Loading from "@/components/Loading";
import {Calendar} from "primereact/calendar";
import {InputText} from "primereact/inputtext";
import {Dropdown} from "primereact/dropdown";
import StorageHelper from "@/helpers/StorageHelper";
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import EventsModal from "./components/EventsModal";
import GlobalHelper from "@/helpers/GlobalHelper";

export default function Content() {

    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [flexClass, setFlexClass] = useState(false);
    const [totalPages, setTotalPages] = useState(1);

    const [filters, setFilters] = useState({
        from: "",
        to: "",
        sourceIP: "",
        sourceDomain: "",
        destinationService: "",
        destinationDomain: "",
        lastStatus: "",
        emailSpecterBounceClassification: "",
        kumoMtaBounceClassification: "",
        page: 1,
    });

    const fetchMessages = async () => {

        setLoading(true);

        const payload = {
            from: filters.from ? filters.from.toISOString().split('T')[0] : "",
            to: filters.to ? filters.to.toISOString().split('T')[0] : "",
            source_ip: filters.sourceIP || "",
            source_domain: filters.sourceDomain || "",
            destination_service: filters.destinationService || "",
            destination_domain: filters.destinationDomain || "",
            last_status: filters.lastStatus || "",
            email_specter_bounce_classification: filters.emailSpecterBounceClassification || "",
            kumo_mta_bounce_classification: filters.kumoMtaBounceClassification || "",
            page: filters.page || 1,
        };

        const response = await RequestHelper.sendAuthenticatedPostRequest("/messages", payload);

        if (response.data.success) {
            setMessages(response.data.data.messages || []);
            setTotalPages(response.data.data.pages || 1);
        } else {
            ToastHelper.errorToast(response.data.message || "We could not fetch messages. Please try again later.");
        }

        setLoading(false);

    };

    useEffect(() => {
        fetchMessages();
    }, [filters]);

    const handleClear = () => {

        setFilters({
            from: "",
            to: "",
            sourceIP: "",
            sourceDomain: "",
            destinationService: "",
            destinationDomain: "",
            lastStatus: "",
            emailSpecterBounceClassification: "",
            kumoMtaBounceClassification: "",
            page: 1,
        });

    };

    const toggleFlexClass = () => {

        if (flexClass) {
            setFlexClass(false);
        } else {
            setFlexClass(true);
        }

        StorageHelper.set("flexClass", !flexClass);

    };

    useEffect(() => {
        StorageHelper.get("flexClass") === "true" ? setFlexClass(true) : setFlexClass(false);
    }, []);

    return (
        <div className={`my-4 ${flexClass ? 'container-fluid' : 'container'}`}>

            <div className="d-flex align-items-center mb-4">

                <div className="flex align-items-center gap-3 mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-900 m-0">Messages</h1>
                        <p className="text-600 m-0 mt-1">
                            View all the latest messages processed by your MTAs. Use the filters to narrow down your search.
                        </p>
                    </div>
                </div>

            </div>

            <Filters filters={filters} setFilters={setFilters} handleClear={handleClear}/>

            {
                loading ? (

                    <Loading/>

                ) : (

                    <div className="card">

                        <div className="card-body">

                            <h5 className="card-title d-flex justify-content-between align-items-center mb-3">

                                <span>
                                    Messages
                                    <span className="badge bg-dark ms-2">
                                        {messages.length}
                                    </span>
                                </span>

                                <div className="d-flex align-items-center gap-2">

                                    <button className="btn btn-sm btn-outline-secondary" onClick={fetchMessages}>
                                        <i className="fa fa-refresh me-1"></i> Refresh
                                    </button>

                                    <button className="btn btn-sm btn-outline-secondary" onClick={toggleFlexClass}>
                                        <i className={`fa ${flexClass ? 'fa-compress' : 'fa-expand'} me-1`}></i>
                                        {flexClass ? 'Compact View' : 'Full View'}
                                    </button>

                                </div>

                            </h5>

                            {

                                messages.length === 0 ? (

                                    <div className="text-center my-5 text-muted">
                                        <i className="fa fa-inbox display-4"></i>
                                        <p>No messages found</p>
                                    </div>

                                ) : (

                                    <MessageTables messages={messages}/>

                                )}

                            <div className="d-flex justify-content-center align-items-center mt-4">
                                <Pagination
                                    currentPage={filters.page || 1}
                                    totalPages={totalPages || 1}
                                    onPageChange={(page) => {
                                        setFilters(prev => ({...prev, page}));
                                    }}
                                />
                            </div>

                        </div>

                    </div>

                )

            }

        </div>
    );

}

function MessageTables({messages}) {

    const [showModal, setShowModal] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState({});

    const getPath = (rowData) => {

        return (
            <div className="flex align-items-center gap-2">
                <span className="font-medium">{rowData['source_domain']}</span>
                <i className="fa fa-arrow-right me-2 ms-2"></i>
                <span className="font-medium">{rowData['destination_domain']}</span>
            </div>
        );

    }

    const getIPDestination = (rowData) => {

        if (!rowData['source_ip'] || !rowData['destination_service']) {
            return <span className="text-muted">N/A</span>;
        }

        return (
            <div className="flex align-items-center gap-2">
                <span className="font-medium">{rowData['source_ip']}</span>
                <i className="fa fa-arrow-right me-2 ms-2"></i>
                <span className="font-medium">{rowData['destination_service']}</span>
            </div>
        );

    }

    const getDateTime = (rowData) => {

        const date = new Date(rowData['updated_at']);

        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        };

        const formattedDate = date.toLocaleString('en-US', options).replace(',', '');

        return (
            <span className="font-medium">{formattedDate}</span>
        );

    };

    const getStatus = (rowData) => {
        const statusBadge = {
            "Reception": "info",
            "TransientFailure": "warning",
            "Bounce": "danger",
            "Delivery": "success"
        }[rowData['last_status']] || "secondary";

        return (
            <div className={`badge bg-${statusBadge}`}>
                {rowData['last_status']}
            </div>
        );

    };

    const showEventsModal = (rowData) => {

        setSelectedMessage(rowData);
        setShowModal(true);

    };

    const closeModal = () => {
        setShowModal(false);
    };

    const getEvents = (rowData) => {

        if (!rowData['events'] || rowData['events'].length === 0) {
            return <span className="text-muted">N/A</span>;
        }

        return (
            <button className="btn btn-sm btn-outline-secondary" onClick={() => showEventsModal(rowData)}>
                Events
                <span className="badge bg-dark ms-2">
                    {rowData['events'].length}
                </span>
            </button>
        );

    };

    const getClassifications = (rowData) => {

        if (rowData['last_status'] !== 'Bounce' && rowData['last_status'] !== 'TransientFailure') {
            return <span className="text-muted">N/A</span>;
        }

        return (
            <div className="flex flex-column fs-sm gap-1">

                <span className="font-medium">
                    <label className={`badge bg-dark`}>{rowData['email_specter_bounce_classification'] || 'N/A'}</label>
                </span>

                <br/>

                <span className="font-medium">
                    <label className={`badge bg-dark`}>{rowData['kumo_mta_bounce_classification'] || 'N/A'}</label>
                </span>

            </div>
        );

    };

    return (
        <>

            <DataTable value={messages}>
                <Column field="date" header="Date & Time" body={(rowData) => getDateTime(rowData)}/>
                <Column field="path" header="Path" body={(rowData) => getPath(rowData)}/>
                <Column field="ip_destination" header="IP Destination" body={(rowData) => getIPDestination(rowData)}/>
                <Column field="status" header="Status" body={(rowData) => getStatus(rowData)}/>
                <Column field="events" header="Events" body={(rowData) => getEvents(rowData)}/>
                <Column field="classifications" header="Classifications" body={(rowData) => getClassifications(rowData)}/>
            </DataTable>

            <EventsModal
                showModal={showModal}
                selectedMessage={selectedMessage}
                onClose={closeModal}
            />

        </>
    );

}

function Filters({filters, setFilters, handleClear}) {

    const [entities, setEntities] = useState({
        destination_services: [],
        kumo_mta_classifications: [],
        source_ips: [],
    });

    const loadTopEntries = async () => {

        const data = await GlobalHelper.fetchTopEntities();

        if (data) {

            setEntities({
                destination_services: data.destination_services || [],
                kumo_mta_classifications: data.kumo_mta_classifications || [],
                source_ips: data.source_ips || [],
            });

        }

    };

    useEffect(() => {
        loadTopEntries();
    }, []);

    const bounceClassificationOptions = ["recipient", "block", "spam", "blacklist", "dmarc", "auth", "envelope", "message", "rate", "capacity", "greylist", "network", "protocol", "config", "other"];
    const statusOptions = ["Reception", "TransientFailure", "Bounce", "Delivery"];

    const handleChange = (e) => {
        const {name, value} = e.target || e;
        setFilters(prev => ({...prev, [name]: value}));
    };

    const handleCalendarChange = (name, value) => {
        setFilters(prev => ({...prev, [name]: value}));
    };

    return (
        <div className="card mb-4">

            <div className="card-body">

                <div className="row g-3">

                    <div className="col-md-3">
                        <label className="form-label">From Date</label>
                        <Calendar
                            name="from"
                            value={filters.from || null}
                            onChange={(e) => handleCalendarChange("from", e.value)}
                            dateFormat="yy-mm-dd"
                            className="w-100"
                            showIcon={false}
                        />
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">To Date</label>
                        <Calendar
                            name="to"
                            value={filters.to || null}
                            onChange={(e) => handleCalendarChange("to", e.value)}
                            dateFormat="yy-mm-dd"
                            className="w-100"
                            showIcon={false}
                        />
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">Source IP</label>
                        <Dropdown
                            name="sourceIP"
                            value={filters.sourceIP || ''}
                            options={entities['source_ips']}
                            onChange={handleChange}
                            placeholder="All Source IPs"
                            className="w-100"
                            filter
                            showClear
                        />
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">Source Domain</label>
                        <InputText
                            name="sourceDomain"
                            value={filters.sourceDomain || ''}
                            onChange={handleChange}
                            className="w-100"
                        />
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">Destination Domain</label>
                        <InputText
                            name="destinationDomain"
                            value={filters.destinationDomain || ''}
                            onChange={handleChange}
                            className="w-100"
                        />
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">Destination Service</label>
                        <Dropdown
                            name="destinationService"
                            value={filters.destinationService || ''}
                            options={entities['destination_services']}
                            onChange={handleChange}
                            placeholder="All Services"
                            className="w-100"
                            filter
                            showClear
                        />
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">Status</label>
                        <Dropdown
                            name="lastStatus"
                            value={filters.lastStatus || ''}
                            options={statusOptions}
                            onChange={handleChange}
                            placeholder="All Statuses"
                            className="w-100"
                            filter
                            showClear
                        />
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">Email Specter Classification</label>
                        <Dropdown
                            name="emailSpecterBounceClassification"
                            value={filters.emailSpecterBounceClassification || ''}
                            options={bounceClassificationOptions}
                            onChange={handleChange}
                            placeholder="All Classifications"
                            className="w-100"
                            filter
                            showClear
                        />
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">KumoMTA Classification</label>
                        <Dropdown
                            name="kumoMtaBounceClassification"
                            value={filters.kumoMtaBounceClassification || ''}
                            options={entities['kumo_mta_classifications']}
                            onChange={handleChange}
                            placeholder="All Classifications"
                            className="w-100"
                            filter
                            showClear
                        />
                    </div>

                    <div className="col-12 d-flex justify-content-end gap-2 mt-3">

                        <button className="btn btn-outline-secondary" onClick={handleClear}>
                            <i className="bi bi-x-circle me-1"></i> Clear
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );

}

function Pagination({currentPage, totalPages, onPageChange}) {

    if (totalPages <= 1) return null;

    const handleClick = (page) => {

        if (page !== currentPage && page >= 1 && page <= totalPages) {
            onPageChange(page);
        }

    };

    const generatePages = () => {

        const pages = [];

        if (currentPage > 3) {

            pages.push(1);

            if (currentPage > 4) {
                pages.push('...');
            }

        }

        for (let i = currentPage - 1; i <= currentPage + 1; i++) {

            if (i > 1 && i < totalPages) {
                pages.push(i);
            }

        }

        if (currentPage < totalPages - 2) {

            if (currentPage < totalPages - 3) {
                pages.push('...');
            }

            pages.push(totalPages);

        }

        return pages;

    };

    return (
        <nav>

            <ul className="pagination">

                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => handleClick(currentPage - 1)}>
                        &laquo;
                    </button>
                </li>

                {generatePages().map((page, index) => (
                    <li
                        key={index}
                        className={`page-item ${page === currentPage ? 'active' : ''} ${page === '...' ? 'disabled' : ''}`}
                    >
                        {page === '...' ? (
                            <span className="page-link">…</span>
                        ) : (
                            <button className="page-link" onClick={() => handleClick(page)}>
                                {page}
                            </button>
                        )}
                    </li>
                ))}

                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => handleClick(currentPage + 1)}>
                        &raquo;
                    </button>
                </li>

            </ul>

        </nav>
    );

}
