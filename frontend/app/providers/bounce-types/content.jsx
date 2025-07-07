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
        event_type: "Bounce"
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

        const response = await RequestHelper.sendAuthenticatedPostRequest("/reports/provider-classification-data", {
            from: GlobalHelper.formatDate(filters.from, "yyyy-MM-dd"),
            to: GlobalHelper.formatDate(filters.to, "yyyy-MM-dd"),
            destination_service: filters.destination_service || "",
            destination_domain: filters.destination_domain || "",
            event_type: filters.event_type || ""
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
                classification: item.classification,
                classification_type: item.classification_type,
                count: item.count || 0
            });

        });

        return tableData.sort((a, b) => b.count - a.count);

    };

    const getChartData = () => {

        if (!reportData?.data || !Array.isArray(reportData.data)) return null;

        const emailSpecterData = reportData.data.filter(item => item.classification_type === 'email_specter_classification');
        const kumoMtaData = reportData.data.filter(item => item.classification_type === 'kumo_mta_classification');

        const labels = [];
        const emailSpecterCounts = [];
        const kumoMtaCounts = [];

        const allClassifications = [...new Set(reportData.data.map(item => item.classification))];

        allClassifications.forEach(classification => {

            labels.push(classification);
            
            const emailSpecterItem = emailSpecterData.find(item => item.classification === classification);
            const kumoMtaItem = kumoMtaData.find(item => item.classification === classification);
            
            emailSpecterCounts.push(emailSpecterItem ? emailSpecterItem.count : 0);
            kumoMtaCounts.push(kumoMtaItem ? kumoMtaItem.count : 0);

        });

        const datasets = [];
        
        if (emailSpecterData.length > 0) {

            datasets.push({
                label: 'Email Specter Classifications',
                data: emailSpecterCounts,
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            });
        }

        if (kumoMtaData.length > 0) {

            datasets.push({
                label: 'Kumo MTA Classifications',
                data: kumoMtaCounts,
                backgroundColor: 'rgba(255, 99, 132, 0.8)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            });

        }

        return {
            labels: labels,
            datasets: datasets
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
                text: 'Classification Distribution'
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

    const getClassificationBadge = (classificationType, value) => {

        const badgeClass = classificationType === 'email_specter_classification' ? 'bg-primary' : 'bg-dark';

        return (
            <span className={`badge text-white ${badgeClass}`}>
                {formatNumber(value)}
            </span>
        );

    };

    const getClassificationTypeBadge = (type) => {

        const badgeClass = type === 'email_specter_classification' ? 'bg-success' : 'bg-info';
        const displayText = type === 'email_specter_classification' ? 'Email Specter' : 'Kumo MTA';
        
        return (
            <span className={`badge text-white ${badgeClass}`}>
                {displayText}
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
                    <h1 className="text-3xl font-bold text-900 m-0">Bounce Types</h1>
                    <p className="text-600 m-0 mt-1">
                        Identify bounce types by provider and service to spot issues and improve deliverability.
                    </p>
                </div>
            </div>

            <div className="card mb-4">
                <div className="card-body">

                    <div className="row g-3">

                        <div className={"col-md-2"}>
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

                        <div className={"col-md-2"}>
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

                        <div className="col-md-2">
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

                        <div className={"col-md-3"}>
                            <label className="form-label">
                                Event Type
                            </label>
                            <Dropdown
                                value={filters.event_type}
                                options={[
                                    { label: 'Bounce', value: 'Bounce' },
                                    { label: 'TransientFailure', value: 'TransientFailure' },
                                ]}
                                onChange={(e) => updateFilter("event_type", e.value)}
                                placeholder="All Types"
                                className="w-100"
                                filter
                                showClear
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
                                    <i className="fa fa-chart-bar me-2"></i>
                                    Bar Chart
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
                                            field="classification"
                                            header="Classification"
                                            sortable
                                            style={{width: '30%'}}
                                        />
                                        <Column
                                            field="classification_type"
                                            header="Classification Type"
                                            sortable
                                            style={{width: '20%'}}
                                            body={(rowData) => getClassificationTypeBadge(rowData.classification_type)}
                                        />
                                        <Column
                                            field="count"
                                            header="Count"
                                            sortable
                                            style={{width: '20%'}}
                                            body={(rowData) => getClassificationBadge(rowData.classification_type, rowData.count)}
                                        />
                                    </DataTable>
                                </div>

                            )}

                            {activeTab === 'chart' && (

                                <div className="tab-pane fade show active">
                                    <div style={{height: '400px'}}>
                                        <Chart
                                            type="bar"
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
