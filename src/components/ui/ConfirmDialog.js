import Swal from 'sweetalert2';

const swalCustomClass = {
    popup: 'my-swal-bg',
    confirmButton: 'my-swal-confirm',
    cancelButton: 'my-swal-cancel'
};

export const confirmDelete = async ({ title = '¿Estás seguro?', text = 'Esta acción no se puede deshacer.' } = {}) => {
    const result = await Swal.fire({
        title,
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        customClass: swalCustomClass,
        buttonsStyling: false
    });

    return result.isConfirmed;
};

export const showSuccess = (title = '¡Éxito!', text = 'Operación completada.') => {
    Swal.fire({
        title,
        text,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'my-swal-bg' }
    });
};

export const showError = (title = 'Error', text = 'Ocurrió un error inesperado.') => {
    Swal.fire({
        title,
        text,
        icon: 'error',
        customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' },
        buttonsStyling: false
    });
};
