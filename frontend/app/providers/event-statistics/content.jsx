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
import GlobalHelper from "@/helpers/GlobalHelper";
import {Chart} from "primereact/chart";

export default function Content() {

    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('table');
    const [reportData, setReportData] = useState(null);

    const [filters, setFilters] = useState({
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date(),
        destination_service: "",
        destination_domain: "",
    });

    const [entities, setEntities] = useState({
        destination_domains: [],
        destination_services: [],
    });

    const updateFilter = (key, value) => {

        setFilters(prevFilters => ({
            ...prevFilters,
            [key]: value
        }));

    }

    const loadTopEntries = async () => {

        const data = await GlobalHelper.fetchTopEntities();

        if (data) {

            setEntities({
                destination_domains: data.destination_domains || [],
                destination_services: data.destination_services || [],
            });

        }

    };

    const generateReport = async () => {

        setLoading(true);

        const response = await RequestHelper.sendAuthenticatedPostRequest("/reports/provider-event-data", {
            from: GlobalHelper.formatDate(filters.from, "yyyy-MM-dd"),
            to: GlobalHelper.formatDate(filters.to, "yyyy-MM-dd"),
            destination_service: filters.destination_service || "",
            destination_domain: filters.destination_domain || "",
        });

        const data = response.data;

        setLoading(false);

        if (data.success) {
            setReportData(data);
        } else {
            ToastHelper.errorToast(data.message);
        }

    };

    const getTableData = () => {

        if (!reportData?.data || !Array.isArray(reportData.data)) return [];

        const tableData = [];

        reportData.data.forEach((item) => {

            tableData.push({
                date: item.date,
                bounce: item.events.Bounce || 0,
                delivery: item.events.Delivery || 0,
                transientFailure: item.events.TransientFailure || 0,
                total: (item.events.Bounce || 0) + (item.events.Delivery || 0) + (item.events.TransientFailure || 0)
            });

        });

        return tableData.sort((a, b) => new Date(b.date) - new Date(a.date));

    };

    const getChartData = () => {

        if (!reportData?.data || !Array.isArray(reportData.data)) return null;

        const sortedData = reportData.data.sort((a, b) => new Date(a.date) - new Date(b.date));
        const dates = sortedData.map(item => item.date);
        const bounceData = sortedData.map(item => item.events.Bounce || 0);
        const deliveryData = sortedData.map(item => item.events.Delivery || 0);
        const transientFailureData = sortedData.map(item => item.events.TransientFailure || 0);

        return {
            labels: dates,
            datasets: [
                {
                    label: 'Deliveries',
                    data: deliveryData,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Bounces',
                    data: bounceData,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Transient Failures',
                    data: transientFailureData,
                    borderColor: '#ffc107',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    tension: 0.4
                }
            ]
        };

    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Event Statistics Over Time'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return value.toLocaleString();
                    }
                }
            }
        }
    };

    const formatNumber = (value) => {
        return value?.toLocaleString() || '0';
    };

    const getEventTypeBadge = (type, value) => {

        const badgeClass = type === 'bounce' ? 'bg-danger' : type === 'delivery' ? 'bg-success' : 'bg-warning';

        return (
            <span className={`badge text-white ${badgeClass}`}>
                {formatNumber(value)}
            </span>
        );

    };

    useEffect(() => {
        loadTopEntries();
    }, []);

    return (
        <div className="container">

            <div className="flex align-items-center gap-3 mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-900 m-0">Event Statistics</h1>
                    <p className="text-600 m-0 mt-1">View delivery counts by domain, service, and time period.</p>
                </div>
            </div>

            <div className="card mb-4">
                <div className="card-body">

                    <div className="row g-3">

                        <div className={"col-md-3"}>
                            <label className="form-label">
                                From Date
                            </label>
                            <Calendar
                                value={filters.from}
                                onChange={(e) => updateFilter("from", e.value)}
                                dateFormat="yy-mm-dd"
                                className="w-100"
                                showIcon={false}
                            />
                        </div>

                        <div className={"col-md-3"}>
                            <label className="form-label">
                                To Date
                            </label>
                            <Calendar
                                value={filters.to}
                                onChange={(e) => updateFilter("to", e.value)}
                                dateFormat="yy-mm-dd"
                                className="w-100"
                                showIcon={false}
                            />
                        </div>

                        <div className="col-md-3">
                            <label className="form-label">
                                Destination Service
                            </label>
                            <Dropdown
                                value={filters.destination_service}
                                options={entities.destination_services}
                                onChange={(e) => updateFilter("destination_service", e.value)}
                                placeholder="All Services"
                                className="w-100"
                                filter
                                showClear
                            />
                        </div>

                        <div className={"col-md-3"}>
                            <label className="form-label">
                                Destination Domain
                            </label>
                            <InputText
                                value={filters.destination_domain}
                                onChange={(e) => updateFilter("destination_domain", e.target.value)}
                                placeholder=""
                                className="w-100"
                            />
                        </div>

                        <div className="col-md-12">

                            <button
                                className="btn btn-primary"
                                onClick={() => generateReport()}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Generating...
                                    </>
                                ) : (
                                    'Generate Report'
                                )}
                            </button>

                        </div>

                    </div>

                </div>
            </div>

            {reportData && (
                <div className="card">
                    <div className="card-body">

                        <ul className="nav nav-tabs mb-4" id="reportTabs" role="tablist">
                            <li className="nav-item" role="presentation">
                                <button
                                    className={`nav-link ${activeTab === 'table' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('table')}
                                    type="button"
                                    role="tab"
                                >
                                    <i className="fa fa-table me-2"></i>
                                    Table View
                                </button>
                            </li>

                            <li className="nav-item" role="presentation">
                                <button
                                    className={`nav-link ${activeTab === 'chart' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('chart')}
                                    type="button"
                                    role="tab"
                                >
                                    <i className="fa fa-chart-line me-2"></i>
                                    Line Chart
                                </button>
                            </li>

                        </ul>

                        <div className="tab-content">

                            {activeTab === 'table' && (

                                <div className="tab-pane fade show active">
                                    <DataTable
                                        value={getTableData()}
                                        paginator
                                        rows={10}
                                        emptyMessage="No data available"
                                        sortMode="single"
                                    >
                                        <Column
                                            field="date"
                                            header="Date"
                                            sortable
                                            style={{width: '15%'}}
                                        />
                                        <Column
                                            field="delivery"
                                            header="Deliveries"
                                            sortable
                                            style={{width: '20%'}}
                                            body={(rowData) => getEventTypeBadge('delivery', rowData.delivery)}
                                        />
                                        <Column
                                            field="bounce"
                                            header="Bounces"
                                            sortable
                                            style={{width: '20%'}}
                                            body={(rowData) => getEventTypeBadge('bounce', rowData.bounce)}
                                        />
                                        <Column
                                            field="transientFailure"
                                            header="Transient Failures"
                                            sortable
                                            style={{width: '20%'}}
                                            body={(rowData) => getEventTypeBadge('transient', rowData.transientFailure)}
                                        />
                                    </DataTable>
                                </div>

                            )}

                            {activeTab === 'chart' && (

                                <div className="tab-pane fade show active">
                                    <div style={{height: '400px'}}>
                                        <Chart
                                            type="line"
                                            data={getChartData()}
                                            options={chartOptions}
                                            style={{height: '100%'}}
                                        />
                                    </div>
                                </div>

                            )}

                        </div>

                    </div>
                </div>
            )}

            {!reportData && !loading && (
                <div className="card">
                    <div className="card-body text-center py-5">
                        <i className="bi bi-bar-chart-line text-muted" style={{fontSize: '3rem'}}></i>
                        <h5 className="text-muted mt-3">No Data Available</h5>
                        <p className="text-muted">Generate a report to view statistics in table and chart format.</p>
                    </div>
                </div>
            )}

        </div>
    );
}
