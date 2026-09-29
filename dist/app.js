const form=document.querySelector('#event-form');
const date=document.querySelector('#date');
const today=new Date();
date.min=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
document.querySelector('#year').textContent=today.getFullYear();
document.querySelectorAll('.select-experience').forEach(button=>button.addEventListener('click',()=>{document.querySelector('#experience').value=button.dataset.experience;document.querySelector('#evento').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}));
let summary='';
form.addEventListener('submit',event=>{event.preventDefault();const data=new FormData(form);summary=`HUELLA HOUSE — MI EVENTO\n\nExperiencia: ${data.get('experiencia')}\nEmpresa: ${data.get('empresa')}\nPersonas: ${data.get('personas')}\nFecha tentativa: ${new Date(data.get('fecha')+'T12:00:00').toLocaleDateString('es-CO',{day:'numeric',month:'long',year:'numeric'})}\nObjetivo: ${data.get('objetivo')||'Por definir'}\n\nResumen de planeación. No constituye una reserva ni confirma disponibilidad.`;document.querySelector('#summary').textContent=summary;document.querySelector('#result').hidden=false;document.querySelector('#result').scrollIntoView({block:'nearest',behavior:'smooth'});});
document.querySelector('#download').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([summary],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='mi-evento-huella-house.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
