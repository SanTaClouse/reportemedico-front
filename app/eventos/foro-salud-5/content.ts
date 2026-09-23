/**
 * Contenido editorial del Foro de Salud Reporte Médico 5.0 (docs/v2/11).
 * Fuente: documento de paneles y textos enviados por Alberto (2026-09-21).
 * Lo operativo (fechas, lugar, inscripción abierta) viene de la API; esto es
 * el texto de la página, que cambia de un año a otro junto con el diseño.
 */

export const EVENT_SLUG = 'foro-salud-5'

/** Imagen de vista previa al compartir (WhatsApp, Instagram, X). La genera docs/v2/make-og-foro-5.py */
export const OG_IMAGE = {
  url: `/eventos/${EVENT_SLUG}/og.png`,
  width: 1200,
  height: 630,
  alt: 'Foro de Salud Reporte Médico 5.0 — 26 de noviembre, Hotel Jaragua, Santo Domingo. Inscripción gratuita.',
}

/** Respaldo si la API no responde: la página nunca queda en blanco */
export const FALLBACK_EVENT = {
  id: '',
  slug: EVENT_SLUG,
  name: 'Foro de Salud Reporte Médico 5.0',
  venueName: 'Hotel Renaissance Santo Domingo Jaragua',
  venueAddress: 'Av. George Washington 367, Santo Domingo',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Renaissance+Santo+Domingo+Jaragua+Hotel',
  dayTitle: 'Jornada Científica',
  dayStartsAt: '2026-11-26T12:00:00.000Z',
  dayEndsAt: '2026-11-26T21:00:00.000Z',
  eveningTitle: 'Gala Aniversaria · 50 Líderes',
  eveningVenue: 'Salón Anacaona',
  eveningStartsAt: '2026-11-26T23:00:00.000Z',
  eveningEndsAt: '2026-11-27T02:00:00.000Z',
  registrationOpen: true,
}

export const INTRO = [
  'En el marco de nuestro 5.º aniversario, Reporte Médico presenta el Foro de Salud 5.0, un encuentro cumbre diseñado para abordar los desafíos clínicos, tecnológicos y estructurales del sistema sanitario en la República Dominicana.',
  'Reunirá a los máximos líderes y ejecutivos de los sectores clave para trazar la hoja de ruta de una atención médica moderna, accesible y de estándares globales.',
]

export interface Panel {
  number: number
  name: string
  headline: string
  tagline: string
  description: string
  points: { title: string; text: string }[]
}

export interface Axis {
  name: string
  summary: string
  panels: Panel[]
}

const PHARMA: Panel = {
  number: 1,
  name: 'Industria Farmacéutica y Laboratorios',
  headline: 'De la molécula al paciente: calidad acreditada, innovación y el futuro de la industria farmacéutica',
  tagline: 'Detrás de cada tratamiento eficaz, existe una molécula con estándares globales de calidad.',
  description:
    'Los máximos líderes de la industria farmacéutica analizan el desarrollo de moléculas certificadas, la calidad en la producción y los grandes retos del sector para asegurar el acceso a tratamientos seguros.',
  points: [
    { title: 'Respuesta terapéutica a las patologías prevalentes', text: 'Disponibilidad y desarrollo de moléculas para hipertensión, diabetes, afecciones cardiovasculares, oncología y patologías respiratorias e infecciosas.' },
    { title: 'Rigor científico, bioequivalencia y acreditación', text: 'Certificaciones de Buenas Prácticas de Manufactura (BPM) e ISO, y la bioequivalencia como garantía médica para el profesional y el paciente.' },
    { title: 'Cadena de suministro y abastecimiento', text: 'Estrategias para evitar el desabastecimiento de moléculas esenciales ante crisis logísticas globales, y la articulación con farmacias y hospitales.' },
    { title: 'Innovación, regulación y farmacovigilancia', text: 'Agilizar los registros sanitarios sin perder rigor y monitorear activamente los efectos adversos.' },
  ],
}

const TOURISM: Panel = {
  number: 2,
  name: 'Turismo de Salud',
  headline: 'Dominicana, destino global: calidad acreditada y el futuro de la atención especializada 360°',
  tagline: 'La visión de los líderes que están transformando la salud en República Dominicana.',
  description:
    'Los máximos ejecutivos de centros médicos acreditados debaten sobre la resolución de patologías complejas, la acreditación internacional de calidad y el futuro de la atención especializada en el país.',
  points: [
    { title: 'Alta complejidad a nivel internacional', text: 'Cirugía cardiovascular, oncología, ortopedia avanzada, cirugía plástica y bariátrica: donde el país ya compite al más alto nivel.' },
    { title: 'Acreditación internacional', text: 'La transformación operativa, el costo y la cultura de seguridad del paciente que exigen sellos como JCI y Accreditation Canada.' },
    { title: 'Comunicación y marca país', text: 'Educar al paciente internacional y diferenciar la oferta médica certificada del intrusismo.' },
    { title: 'La ruta del paciente', text: 'Desde que investiga su condición en el extranjero hasta su recuperación y seguimiento en su país de origen.' },
  ],
}

const EDUCATION: Panel = {
  number: 3,
  name: 'Educación Médica',
  headline: 'Formando al médico del futuro: innovación, calidad académica y el rol de las universidades en RD',
  tagline: 'La excelencia en salud comienza en la academia.',
  description:
    'Los decanos de Medicina de las principales universidades del país debaten sobre el perfil del médico del futuro, la acreditación académica, la investigación y la innovación en la formación.',
  points: [
    { title: 'Evolución curricular y respuesta clínica', text: 'La enseñanza médica frente al perfil epidemiológico actual y los desafíos del sistema de salud dominicano.' },
    { title: 'Estándares de acreditación', text: 'Los procesos de evaluación e investigación científica que respaldan la calidad de las facultades de medicina.' },
    { title: 'Innovación en el aprendizaje', text: 'Simulación clínica, herramientas digitales y habilidades de comunicación para la relación médico-paciente.' },
    { title: 'Visión 360° del egresado', text: 'Formar profesionales competitivos a nivel nacional e internacional.' },
  ],
}

const INFRASTRUCTURE: Panel = {
  number: 4,
  name: 'Infraestructura Médica',
  headline: 'Más allá del concreto: los nuevos proyectos que redefinen el sistema de salud dominicano',
  tagline: 'Acreditación y expansión de servicios: la visión ejecutiva de la infraestructura médica.',
  description:
    'Cuatro de los principales ejecutivos de la infraestructura hospitalaria del país analizan las nuevas edificaciones clínicas, la ampliación de servicios especializados y los estándares globales que garantizan entornos seguros para el paciente.',
  points: [
    { title: 'Nuevas edificaciones y expansión', text: 'Centros diseñados desde los planos para cumplir con rigurosas normativas internacionales.' },
    { title: 'Bioseguridad y eficiencia', text: 'Bioseguridad, eficiencia energética y flujos asistenciales optimizados.' },
    { title: 'Alta complejidad', text: 'Infraestructura pensada para el tratamiento de patologías y procedimientos complejos.' },
  ],
}

const FINANCE: Panel = {
  number: 5,
  name: 'Banca, Inversión y Financiamiento',
  headline: 'Líderes financieros en la salud: ¿cómo hacer bancable un proyecto médico?',
  tagline: 'Criterios, garantías y apoyo financiero en RD.',
  description:
    'Cuatro de los máximos representantes de la banca empresarial, corporativa y los fondos de inversión revelan las claves para financiar proyectos de infraestructura clínica y emprender con éxito en el sector salud.',
  points: [
    { title: 'Bancabilidad de proyectos médicos', text: 'Qué evalúan los bancos en el plan de negocios de un nuevo centro de salud o grupo de especialistas.' },
    { title: 'Acceso a capital para emprendedores', text: 'Herramientas crediticias, plazos y esquemas para médicos que quieren fundar o expandir sus unidades clínicas.' },
    { title: 'Financiamiento de tecnología', text: 'Leasing, líneas de crédito e inversión en equipamiento médico de alta resolución.' },
    { title: 'Sostenibilidad y retorno de inversión', text: 'La viabilidad de los servicios médicos a largo plazo y su impacto en la economía nacional.' },
  ],
}

const INSURANCE: Panel = {
  number: 6,
  name: 'Aseguramiento y Seguridad Social (ARS)',
  headline: 'Protección, cobertura y sostenibilidad: el rol estratégico de las ARS en la salud dominicana',
  tagline: 'Garantizar la protección de la salud es el pilar de un país que avanza.',
  description:
    'Cuatro de los máximos ejecutivos de las Administradoras de Riesgos de Salud más relevantes del país analizan el futuro de la cobertura médica, la prevención y el impacto del aseguramiento en la calidad de vida.',
  points: [
    { title: 'Sostenibilidad y cobertura eficiente', text: 'Equilibrar la viabilidad financiera del sistema con la ampliación de servicios para los afiliados.' },
    { title: 'Atención a patologías prevalentes', text: 'Programas de manejo integral para diabetes, hipertensión, enfermedades cardiovasculares y condiciones de alto costo.' },
    { title: 'Innovación y salud digital', text: 'Autorizaciones automáticas, carnés digitales y herramientas que agilizan el acceso en los centros de salud.' },
    { title: 'Relación con el sector médico', text: 'Más sinergia entre ARS, médicos prestadores y centros de salud en beneficio del paciente.' },
  ],
}

const MEDTECH: Panel = {
  number: 7,
  name: 'Tecnología Médica 5.0',
  headline: 'Dispositivos de última generación que redefinen la atención en República Dominicana',
  tagline: 'El futuro del diagnóstico y tratamiento: robótica, inteligencia artificial y equipamiento de alta resolución.',
  description:
    'Los principales ejecutivos y distribuidores de tecnología médica analizan los dispositivos de última generación, la inteligencia aplicada al diagnóstico y el futuro del equipamiento clínico en el país.',
  points: [
    { title: 'Dispositivos de última generación', text: 'Imagenología de alta resolución, robótica quirúrgica, monitoreo digital y dispositivos biomédicos de vanguardia.' },
    { title: 'Impacto en patologías prevalentes', text: 'Enfermedades cardiovasculares y neurológicas, oncología, cirugía bariátrica y cirugía plástica.' },
    { title: 'Capacitación y soporte técnico', text: 'Entrenamiento continuo del personal médico y mantenimiento preventivo garantizado.' },
    { title: 'Acceso e integración', text: 'Criterios para que centros públicos y privados adquieran tecnología de alta gama de forma sostenible.' },
  ],
}

const PUBLIC_HEALTH: Panel = {
  number: 8,
  name: 'Salud Pública y Red Hospitalaria',
  headline: 'El Estado y la salud: avances, reformas y desafíos del sistema sanitario dominicano',
  tagline: 'La visión oficial del Estado sobre el presente y el futuro de la salud en RD.',
  // Sin nombrar autoridades hasta que confirmen su participación
  description:
    'Un diálogo directo con las máximas autoridades del sistema sanitario estatal sobre los avances en la red hospitalaria, las políticas de prevención y los desafíos para garantizar una atención de calidad para todos.',
  points: [
    { title: 'Rectoría y políticas sanitarias', text: 'Prevención de riesgos, vigilancia epidemiológica y modernización de las normativas de salud.' },
    { title: 'Transformación de la red hospitalaria', text: 'Remozamiento de hospitales, nuevas unidades especializadas y fortalecimiento de la atención primaria.' },
    { title: 'Tecnología e insumos en el sector público', text: 'Equipamiento moderno y abastecimiento de medicamentos esenciales.' },
    { title: 'Los grandes desafíos del Estado', text: 'Presupuesto, distribución del talento médico y la ruta hacia una cobertura de salud universal y equitativa.' },
  ],
}

const GUILD: Panel = {
  number: 9,
  name: 'Gremio Médico y sus Desafíos',
  headline: 'Leyes, gremio y ejercicio médico: el impacto de las políticas públicas en la práctica clínica',
  tagline: 'El rol de las sociedades médicas y el CMD en las reformas para un ejercicio médico digno y seguro.',
  description:
    'Líderes del Colegio Médico Dominicano, las sociedades médicas especializadas y expertos en derecho sanitario analizan las leyes que rigen el ejercicio profesional, la recertificación y la protección legal del médico.',
  points: [
    { title: 'Revisión de las leyes sanitarias', text: 'Retos y propuestas de modificación a la Ley 42-01 y la Ley 87-01.' },
    { title: 'Recertificación y lucha contra el intrusismo', text: 'El papel de las sociedades especializadas en garantizar el estándar ético y científico.' },
    { title: 'Seguridad jurídica en la consulta y el quirófano', text: 'Herramientas y protocolos para prevenir la judicialización de la medicina.' },
    { title: 'Participación en la agenda nacional', text: 'Un gremio con liderazgo técnico en la formulación de leyes y políticas de salud.' },
  ],
}

/** Los 9 paneles agrupados en los 3 ejes del flyer oficial */
export const AXES: Axis[] = [
  { name: 'Industria & Tecnología', summary: 'Pharma, laboratorios e innovación', panels: [PHARMA, MEDTECH] },
  { name: 'Estrategia & Economía', summary: 'Banca, inversión, turismo de salud y ARS', panels: [FINANCE, TOURISM, INSURANCE] },
  { name: 'Desarrollo & Gremio', summary: 'Infraestructura, red hospitalaria y educación médica', panels: [INFRASTRUCTURE, PUBLIC_HEALTH, EDUCATION, GUILD] },
]

export const LEADERS = {
  title: '50 Líderes que Transforman la Salud en RD',
  motto: 'Un futuro en marcha',
  paragraphs: [
    'Como parte de las celebraciones de nuestro aniversario presentamos «50 Líderes que Transforman la Salud en RD», un reconocimiento a los profesionales, directivos y pioneros cuyas trayectorias, innovación y compromiso están redefiniendo los estándares de la medicina, la investigación y la gestión sanitaria en la República Dominicana.',
    'La gran gala de entrega será el 26 de noviembre en el Salón Anacaona del Hotel Renaissance Santo Domingo Jaragua: una noche que combinará la excelencia institucional, el networking estratégico y el merecido tributo a quienes construyen el futuro de la salud dominicana.',
  ],
  magazine: 'Durante el evento se distribuirá la Edición Especial Aniversaria de la revista Reporte Médico.',
}

export const ACCESS_STEPS = [
  { title: 'Inscríbete', text: 'Completa el formulario en menos de un minuto. Es gratis.' },
  { title: 'Te confirmamos', text: 'Es un evento con cupos: revisamos tu inscripción y te avisamos por email.' },
  { title: 'Recibe tu QR', text: 'Al aprobarla, te llega por email tu código QR de acceso. Lo repetimos antes del evento.' },
  { title: 'Muéstralo en la entrada', text: 'Desde el celular o impreso. Así entras sin filas.' },
]
