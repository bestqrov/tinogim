import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding demo teacher...');

    // 1 ─ Hash password
    const hashedPassword = await bcrypt.hash('teacher123', 10);

    // 2 ─ Create students (skip if phone already exists)
    const studentData = [
        { name: 'Karim',   surname: 'Alaoui',    phone: '0600000001', schoolLevel: 'Terminale' },
        { name: 'Salma',   surname: 'Benali',     phone: '0600000002', schoolLevel: 'Terminale' },
        { name: 'Yassine', surname: 'Hajji',      phone: '0600000003', schoolLevel: 'Terminale' },
        { name: 'Nour',    surname: 'Rachidi',    phone: '0600000004', schoolLevel: 'Terminale' },
        { name: 'Amine',   surname: 'Tazi',       phone: '0600000005', schoolLevel: '1ère Bac' },
        { name: 'Hajar',   surname: 'Moussaoui',  phone: '0600000006', schoolLevel: '1ère Bac' },
        { name: 'Omar',    surname: 'Filali',     phone: '0600000007', schoolLevel: '1ère Bac' },
    ];

    const students = await Promise.all(
        studentData.map(async s => {
            const existing = await prisma.student.findFirst({ where: { phone: s.phone } });
            if (existing) return existing;
            return prisma.student.create({
                data: { name: s.name, surname: s.surname, phone: s.phone, schoolLevel: s.schoolLevel, active: true },
            });
        })
    );

    const [s1, s2, s3, s4, s5, s6, s7] = students;
    console.log(`✅ ${students.length} students ready`);

    // 3 ─ Create teacher (skip if already exists)
    let teacher = await prisma.teacher.findFirst({ where: { email: 'youssef@enovaacademy.ma' } });
    if (teacher) {
        console.log(`⚠️  Teacher already exists (id: ${teacher.id}), skipping creation.`);
    } else {
        teacher = await prisma.teacher.create({
            data: {
                name: 'أستاذ يوسف بنعلي',
                email: 'youssef@enovaacademy.ma',
                phone: '0661234567',
                cin: 'BE123456',
                gender: 'male',
                status: 'active',
                specialties: ['Mathématiques', 'Physique'],
                levels: ['Terminale', '1ère Bac'],
                socialMedia: { whatsapp: '212661234567' },
                password: hashedPassword,
                loginEnabled: true,
            },
        });
        console.log(`✅ Teacher created: ${teacher.name} (id: ${teacher.id})`);
    }

    // 4 ─ Create groups linked to teacher (skip if already exist)
    const existingGroups = await prisma.group.findMany({ where: { teacherId: teacher.id } });
    if (existingGroups.length >= 2) {
        console.log(`⚠️  Groups already exist for this teacher, skipping.`);
        existingGroups.forEach(g => console.log(`   - "${g.name}"`));
    } else {
        const group1 = await prisma.group.create({
            data: {
                name: 'Groupe Maths Terminale A',
                type: 'SOUTIEN',
                subject: 'Mathématiques',
                level: 'Terminale',
                room: 'Salle 3',
                whatsappUrl: 'https://chat.whatsapp.com/example1',
                timeSlots: [
                    { day: 'Lundi',  startTime: '14:00', endTime: '16:00' },
                    { day: 'Jeudi',  startTime: '16:00', endTime: '18:00' },
                ],
                teacherId: teacher.id,
                studentIds: [s1.id, s2.id, s3.id, s4.id],
            },
        });

        const group2 = await prisma.group.create({
            data: {
                name: 'Groupe Physique 1ère Bac',
                type: 'SOUTIEN',
                subject: 'Physique-Chimie',
                level: '1ère Bac',
                room: 'Salle 1',
                whatsappUrl: 'https://chat.whatsapp.com/example2',
                timeSlots: [
                    { day: 'Mardi', startTime: '10:00', endTime: '12:00' },
                ],
                teacherId: teacher.id,
                studentIds: [s5.id, s6.id, s7.id],
            },
        });

        console.log(`✅ Group 1: "${group1.name}" (4 students)`);
        console.log(`✅ Group 2: "${group2.name}" (3 students)`);
    }
    console.log('');
    console.log('─────────────────────────────────────────');
    console.log('Teacher login credentials:');
    console.log(`  Email   : youssef@enovaacademy.ma`);
    console.log(`  Password: teacher123`);
    console.log('─────────────────────────────────────────');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
