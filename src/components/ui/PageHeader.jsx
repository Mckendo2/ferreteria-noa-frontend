import React from 'react';

const PageHeader = ({ title, actionLabel, actionIcon: ActionIcon, onAction }) => {
    return (
        <header className="page-header module-header">
            <h2>{title}</h2>
            {actionLabel && onAction && (
                <button
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onClick={onAction}
                >
                    {ActionIcon && <ActionIcon size={16} />}
                    {actionLabel}
                </button>
            )}
        </header>
    );
};

export default PageHeader;
