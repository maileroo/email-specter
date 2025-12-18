"use client";

import {useState, useEffect} from "react";
import {ToastHelper} from "@/helpers/ToastHelper";

export default function EditConnectionModal({show, mta, onClose, onSubmit}) {

    const [mtaName, setMtaName] = useState("");

    useEffect(() => {

        if (mta) {
            setMtaName(mta.name);
        }

    }, [mta]);

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!mtaName.trim()) {
            ToastHelper.errorToast('Please enter a connection name');
            return;
        }

        await onSubmit(mta.id, mtaName.trim());

        setMtaName("");

    };

    const handleClose = () => {
        setMtaName("");
        onClose();
    };

    if (!show || !mta) return null;

    return (
        <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} onClick={handleClose}>
            <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Edit Connection</h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={handleClose}
                        ></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label htmlFor="editMtaName" className="form-label">Connection Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="editMtaName"
                                    value={mtaName}
                                    onChange={(e) => setMtaName(e.target.value)}
                                    required
                                />
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
                                Update Connection
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
