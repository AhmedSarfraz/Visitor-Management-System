import React from 'react'
import { addDays } from 'date-fns';
import { DateRangePicker } from 'react-date-range';
import { Modal, ModalBody, Button } from 'reactstrap';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css';

function DateRangePickerModal({isOpen, handleClose, filters, setFilters}) {
    return (
        <Modal isOpen={isOpen} className="vms-ticket-modal text-center" style={{maxWidth: "40%"}}>
            <ModalBody>
                <DateRangePicker
                    onChange={item => setFilters({ ...filters, ...item })}
                    months={1}
                    minDate={addDays(new Date(), -300)}
                    maxDate={new Date()}
                    direction="vertical"
                    scroll={{ enabled: true }}
                    ranges={[filters.selection]}
                />
                <Button className="btn float-right" onClick={() => handleClose()}><i className="fa fa-times" aria-hidden="true" /></Button>
            </ModalBody>
        </Modal>
    )
}

export default DateRangePickerModal
