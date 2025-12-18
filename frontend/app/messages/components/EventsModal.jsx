import React from 'react';

export default function EventsModal({showModal, selectedMessage, onClose}) {

    const formatEventDateTime = (dateString) => {

        const date = new Date(dateString);

        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        };

        return date.toLocaleString('en-US', options);

    };

    const getEventTypeIcon = (eventType) => {

        const icons = {
            "Reception": "fa-check-circle text-info",
            "TransientFailure": "fa-exclamation-triangle text-warning",
            "Bounce": "fa-times-circle text-danger",
            "Delivery": "fa-paper-plane text-success"
        };

        return icons[eventType] || "fa-circle text-secondary";

    };

    const getEventTypeBadge = (eventType) => {

        const badges = {
            "Reception": "info",
            "TransientFailure": "warning",
            "Bounce": "danger",
            "Delivery": "success",
            "Injection": "primary"
        };

        return badges[eventType] || "secondary";

    };

    if (!showModal) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} onClick={onClose}>

            <div className="modal-dialog modal-xl" onClick={(e) => e.stopPropagation()}>

                <div className="modal-content">

                    <div className="modal-header bg-primary text-white">

                        <h5 className="modal-title">
                            <i className="fa fa-list-alt me-2"></i>
                            Message Events
                        </h5>

                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>

                    </div>

                    <div className="modal-body modal-body-restricted">

                        <div className="card mb-4 bg-light">

                            <div className="card-body">

                                <h6 className="card-title mb-3">
                                    <i className="fa fa-envelope me-2"></i>
                                    Message Information
                                </h6>

                                <div className="row">

                                    <div className="col-md-6">
                                        <small className="text-muted">From:</small>
                                        <p className="mb-2 font-monospace">{selectedMessage.sender || 'N/A'}</p>
                                    </div>

                                    <div className="col-md-6">
                                        <small className="text-muted">To:</small>
                                        <p className="mb-2 font-monospace">{selectedMessage.recipient || 'N/A'}</p>
                                    </div>

                                    <div className="col-md-6">
                                        <small className="text-muted">Source:</small>
                                        <p className="mb-2">
                                            <span className="font-monospace me-1">{selectedMessage.source_ip || 'N/A'}</span>
                                        </p>
                                    </div>

                                    <div className="col-md-6">
                                        <small className="text-muted">Destination:</small>
                                        <p className="mb-2">
                                            <span className="badge bg-dark me-1">{selectedMessage.destination_service || 'N/A'}</span>
                                            <span className="text-muted">{selectedMessage.destination_domain || 'N/A'}</span>
                                        </p>
                                    </div>

                                </div>

                            </div>

                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-3">

                            <h6 className="mb-0">
                                <i className="fa fa-clock me-2"></i>
                                Events Timeline
                            </h6>

                            <span className="badge bg-primary">
                                {selectedMessage.events.length}
                            </span>

                        </div>

                        <div className="timeline">

                            {selectedMessage.events.length === 0 ? (

                                <div className="text-center text-muted py-4">
                                    <i className="fa fa-inbox fa-2x mb-2"></i>
                                    <p>No events found for this message</p>
                                </div>

                            ) : (

                                selectedMessage.events.map((event, index) => (

                                    <div key={index} className="timeline-item mb-4">

                                        <div className="card">
                                            <div className="card-body">

                                                <div className="d-flex justify-content-between align-items-start mb-2">

                                                    <div>
                                                        <h6 className="mb-1">
                                                            <i className={`fa ${getEventTypeIcon(event.type)} me-2`}></i>
                                                            {event.type || 'Unknown Event'}
                                                            <span className={`badge bg-${getEventTypeBadge(event.type)} ms-2`}>
                                                                #{index + 1}
                                                            </span>
                                                        </h6>
                                                        <small className="text-muted">
                                                            <i className="fa fa-clock me-1"></i>
                                                            {formatEventDateTime(event.datetime)}
                                                        </small>
                                                    </div>

                                                </div>

                                                {event.content && (
                                                    <div className="mb-2">
                                                        <p className="mb-1 font-monospace small bg-light p-2 rounded">
                                                            {event.content}
                                                        </p>
                                                    </div>
                                                )}

                                            </div>

                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            <i className="fa fa-times me-1"></i>
                            Close
                        </button>
                    </div>

                </div>

            </div>

        </div>
    );

}
