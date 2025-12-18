"use client";

import {useState} from "react";
import {ToastHelper} from "@/helpers/ToastHelper";

export default function AddConnectionModal({show, onClose, onSubmit}) {

    const [mtaName, setMtaName] = useState("");

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!mtaName.trim()) {
            ToastHelper.errorToast('Please enter a connection name');
            return;
        }

        await onSubmit(mtaName.trim());

        setMtaName("");

    };

    const handleClose = () => {
        setMtaName("");
        onClose();
    };

    if (!show) return null;

    return (
        <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} onClick={handleClose}>
            <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Add New Connection</h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={handleClose}
                        ></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label htmlFor="mtaName" className="form-label">Connection Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="mtaName"
                                    value={mtaName}
                                    onChange={(e) => setMtaName(e.target.value)}
                                    placeholder="e.g., Production Mail Server"
                                    required
                                />
                                <div className="form-text">
                                    Give your connection a descriptive name to identify it easily.
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleClose}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Add Connection
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );

}
