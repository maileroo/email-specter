"use client";

import {ToastHelper} from "@/helpers/ToastHelper";
import GlobalHelper from "@/helpers/GlobalHelper";

export default function ConnectionCard({mta, onEdit, onDelete, onRotateToken}) {

    const copyToClipboard = (text) => {
        GlobalHelper.copyToClipboard(text);
        ToastHelper.successToast('Copied!');
    };

    const getConfigurationCode = (collectionUrl) => {

        return `local log_hooks = require 'policy-extras.log_hooks'

log_hooks:new {
  name = 'email_specter',
  batch_size = 100,
  log_parameters = {
    headers = { 'From', 'Subject', 'Message-ID', 'To' },
  },
  queue_config = {
    retry_interval = '1m',
    max_retry_interval = '20m',
  },
  constructor = function(domain, tenant, campaign)
  
    local connection = {}
    local client = kumo.http.build_client {}

    function connection:send_batch(messages)
\t
      local url = '${collectionUrl}'
      local payloads = {}
\t  
      for i = 1, #messages do
        local data = messages[i]:get_data()
        if data and #data > 0 then table.insert(payloads, data) end
      end
\t  
      local body = '[' .. table.concat(payloads, ',') .. ']'

      local response = client
        :post(url)
        :header('Content-Type', 'application/json')
        :header('User-Agent', 'Webhook/1.0')
        :body(body)
        :send()

      local status_code = response:status_code()
      local status_reason = response:status_reason()
      local response_text = response:text()
      local disposition = string.format('%d %s: %s', status_code, status_reason, response_text)
\t  
      if response:status_is_success() then
        return disposition
      else
        kumo.log_warn(string.format('[Email Specter]: %s', disposition))
      end

      kumo.reject(500, disposition)
\t  
    end

    function connection:close()
      client:close()
    end

    return connection
  end,
}`;

    };

    return (
        <div className="col-lg-6 col-xl-4 mb-4">

            <div className="card h-100">

                <div className="card-body">

                    <div className="d-flex justify-content-between align-items-start mb-3">

                        <h5 className="card-title mb-0">
                            {mta.name}
                        </h5>

                        <div className="dropdown">

                            <button className="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i className="fas fa-ellipsis-v"></i>
                            </button>

                            <ul className="dropdown-menu">

                                <li>
                                    <button className="dropdown-item" onClick={() => onEdit(mta)}>
                                        <i className="fas fa-edit me-2"></i> Edit
                                    </button>
                                </li>

                                <li>
                                    <button className="dropdown-item" onClick={() => onRotateToken(mta)}>
                                        <i className="fas fa-sync me-2"></i> Rotate Token
                                    </button>
                                </li>

                                <li>
                                    <hr className="dropdown-divider"/>
                                </li>

                                <li>
                                    <button className="dropdown-item" onClick={() => onDelete(mta)}>
                                        <i className="fas fa-trash me-2"></i> Delete
                                    </button>
                                </li>

                            </ul>

                        </div>

                    </div>

                    <div className="mb-3">

                        <label className="form-label small text-muted">
                            Webhook URL:
                        </label>

                        <div className="input-group">
                            <input type="text" className="form-control form-control-sm" value={mta['collection_url']} readOnly/>
                            <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => copyToClipboard(mta['collection_url'])} title="Copy to clipboard">
                                <i className="fas fa-copy"></i>
                            </button>
                        </div>

                    </div>

                    <div className="mb-3">

                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label small text-muted mb-0">
                                Configuration Code:
                            </label>
                            <button className="btn btn-outline-dark btn-sm" type="button" onClick={() => copyToClipboard(getConfigurationCode(mta.collection_url))} title="Copy configuration code">
                                <i className="fas fa-copy me-1"></i>
                                Copy Code
                            </button>
                        </div>

                        <div className="position-relative">
                            <pre className="bg-dark text-light p-3 rounded" style={{fontSize: '0.85rem', overflow: 'auto'}}>
                                <code>{getConfigurationCode(mta['collection_url'])}</code>
                            </pre>
                        </div>

                        <p className="fs-xs text-muted mt-2">
                            Copy and paste this code into your KumoMTA <code>/opt/kumomta/etc/policy/init.lua</code> file to set up the webhook.
                        </p>

                    </div>

                </div>

            </div>

        </div>
    );

}
