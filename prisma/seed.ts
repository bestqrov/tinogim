import { PrismaClient, InscriptionType, TransactionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting database seed...');

    // Create SUPER ADMIN account
    const hashedSuperAdminPassword = await bcrypt.hash('superadmin123', 10);

    const superAdmin = await prisma.user.upsert({
        where: { email: 'superadmin@enovazoneacadimeca.com' },
        update: {},
        create: {
            email: 'superadmin@enovazoneacadimeca.com',
            password: hashedSuperAdminPassword,
            name: 'مدير النظام الرئيسي - Enovazone Acadimeca',
            role: 'SUPER_ADMIN',
            gsm: '+212600000001',
            whatsapp: '+212600000001',
            address: 'المكتب الرئيسي - معهد Enovazone Acadimeca',
        },
    });

    console.log('✅ Super Admin account created:', {
        email: superAdmin.email,
        name: superAdmin.name,
        role: superAdmin.role,
    });

    // Create admin account
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@enovazoneacadimeca.com' },
        update: {},
        create: {
            email: 'admin@enovazoneacadimeca.com',
            password: hashedAdminPassword,
            name: 'مدير معهد Enovazone Acadimeca',
            role: 'ADMIN',
            gsm: '+212600000002',
            whatsapp: '+212600000002',
            address: 'مكتب الإدارة - معهد Enovazone Acadimeca',
        },
    });


    console.log('✅ Admin account created:', {
        email: admin.email,
        name: admin.name,
        role: admin.role,
    });

    // Create secretary account
    const hashedPassword = await bcrypt.hash('secretary123', 10);

    const secretary = await prisma.user.upsert({
        where: { email: 'secretary@enovazoneacadimeca.com' },
        update: {
            name: 'سكرتيرة معهد Enovazone Acadimeca',
        },
        create: {
            email: 'secretary@enovazoneacadimeca.com',
            password: hashedPassword,
            name: 'سكرتيرة معهد Enovazone Acadimeca',
            role: 'SECRETARY',
            gsm: '+212600000003',
            whatsapp: '+212600000003',
            address: 'مكتب الاستقبال - معهد Enovazone Acadimeca',
        },
    });

    console.log('✅ Secretary account created:', {
        email: secretary.email,
        name: secretary.name,
        role: secretary.role,
    });

    console.log('\n📋 بيانات تسجيل الدخول:');
    console.log('\n🔐 مدير النظام الرئيسي (SUPER_ADMIN):');
    console.log('Email: superadmin@enovazoneacadimeca.com');
    console.log('Password: superadmin123');
    console.log('\n🔐 المدير (ADMIN):');
    console.log('Email: admin@enovazoneacadimeca.com');
    console.log('Password: admin123');
    console.log('\n🔐 السكرتيرة (SECRETARY):');
    console.log('Email: secretary@enovazoneacadimeca.com');
    console.log('Password: secretary123');
    console.log('\n⚠️  يرجى تغيير كلمات المرور بعد أول تسجيل دخول!');

    // Create sample formations
    const formations = [
        {
            name: 'تكوين في التطوير الرقمي',
            duration: '6 أشهر',
            price: 3000,
            description: 'تكوين شامل في تطوير المواقع (HTML, CSS, JavaScript, React, Node.js)',
        },
        {
            name: 'تكوين في التسويق الرقمي',
            duration: '3 أشهر',
            price: 1500,
            description: 'إتقان الشبكات الاجتماعية والإعلان الرقمي',
        },
        {
            name: 'تكوين في التصميم الجرافيكي',
            duration: '4 أشهر',
            price: 2000,
            description: 'تعلم Photoshop, Illustrator و InDesign',
        },
        {
            name: 'تكوين في المحاسبة العملية',
            duration: '3 أشهر',
            price: 1800,
            description: 'تكوين عملي في Sage و Excel',
        },
        {
            name: 'تكوين اللغة الإنجليزية المتقدمة',
            duration: '4 أشهر',
            price: 1200,
            description: 'تطوير مهارات اللغة الإنجليزية للمستوى المتقدم',
        },
    ];

    console.log('\nإنشاء التكوينات التجريبية...');
    const createdFormations = [];
    for (const formation of formations) {
        let existing = await prisma.formation.findFirst({
            where: { name: formation.name }
        });

        if (!existing) {
            existing = await prisma.formation.create({
                data: formation
            });
            console.log(`تم إنشاء التكوين: ${formation.name}`);
        } else {
            console.log(`التكوين موجود مسبقاً: ${formation.name}`);
        }
        createdFormations.push(existing);
    }

    // Create sample teachers
    console.log('\nإنشاء المعلمين التجريبيين...');
    const teachersData = [
        {
            name: 'أستاذ أحمد المنصوري',
            email: 'ahmed.mansouri@enovazoneacadimeca.com',
            phone: '+212661234567',
            cin: 'AB123456',
            gender: 'ذكر',
            specialties: ['Maths', 'Physique et Chimique'],
            levels: ['Lycée', 'Collège'],
            hourlyRate: 150,
            paymentType: 'HOURLY',
        },
        {
            name: 'أستاذة فاطمة الزهراء',
            email: 'fatima.zahra@enovazoneacadimeca.com',
            phone: '+212662345678',
            cin: 'CD789012',
            gender: 'أنثى',
            specialties: ['Français', 'Anglais'],
            levels: ['Lycée', 'Collège', 'Primaire'],
            hourlyRate: 120,
            paymentType: 'HOURLY',
        },
        {
            name: 'أستاذ يوسف الإدريسي',
            email: 'youssef.idrisi@enovazoneacadimeca.com',
            phone: '+212663456789',
            cin: 'EF345678',
            gender: 'ذكر',
            specialties: ['S.V.T', 'Sciences'],
            levels: ['Lycée', 'Collège'],
            hourlyRate: 140,
            paymentType: 'HOURLY',
        },
        {
            name: 'أستاذة خديجة العلوي',
            email: 'khadija.alaoui@enovazoneacadimeca.com',
            phone: '+212664567890',
            cin: 'GH901234',
            gender: 'أنثى',
            specialties: ['تطوير الويب', 'التصميم الجرافيكي'],
            levels: ['تكوين مهني'],
            hourlyRate: 200,
            paymentType: 'FIXED',
            commission: 15,
        },
    ];

    const createdTeachers = [];
    for (const teacherData of teachersData) {
        let teacher = await prisma.teacher.findFirst({
            where: { email: teacherData.email }
        });

        if (!teacher) {
            teacher = await prisma.teacher.create({
                data: {
                    ...teacherData,
                    status: 'Active',
                    socialMedia: {
                        whatsapp: teacherData.phone,
                        email: teacherData.email
                    }
                }
            });
            console.log(`تم إنشاء المعلم: ${teacherData.name}`);
        } else {
            console.log(`المعلم موجود مسبقاً: ${teacherData.name}`);
        }
        createdTeachers.push(teacher);
    }

    // Create sample students
    console.log('\nإنشاء الطلاب التجريبيين...');
    const studentsData = [
        {
            name: 'محمد',
            surname: 'بوعزة',
            phone: '+212671111111',
            email: 'mohammed.bouazza@gmail.com',
            address: 'حي المسيرة، الدار البيضاء',
            birthDate: new Date('2005-03-15'),
            birthPlace: 'الدار البيضاء',
            fatherName: 'عبد الله بوعزة',
            motherName: 'فاطمة الزهراء',
            parentPhone: '+212671111111',  
            parentRelation: 'الوالد',
            schoolLevel: 'Lycée',
            currentSchool: 'ثانوية محمد الخامس',
        },
        {
            name: 'آية',
            surname: 'المرني',
            phone: '+212672222222',
            email: 'aya.marni@gmail.com',
            address: 'حي النهضة، الرباط',
            birthDate: new Date('2006-07-22'),
            birthPlace: 'الرباط',
            fatherName: 'عمر المرني',
            motherName: 'سعاد الكريمي',
            parentPhone: '+212672222222',
            parentRelation: 'الوالدة',
            schoolLevel: 'Collège',
            currentSchool: 'إعدادية الأطلس',
        },
        {
            name: 'يوسف',
            surname: 'الفاسي',
            phone: '+212673333333',
            email: 'youssef.fassi@gmail.com',
            address: 'المدينة القديمة، فاس',
            birthDate: new Date('2004-11-10'),
            birthPlace: 'فاس',
            fatherName: 'إدريس الفاسي',
            motherName: 'خديجة بنعلي',
            parentPhone: '+212673333333',
            parentRelation: 'الوالد',
            schoolLevel: 'Lycée',
            currentSchool: 'ثانوية المولى إدريس',
        },
        {
            name: 'سارة',
            surname: 'الأندلسي',
            phone: '+212674444444',
            email: 'sara.andaloussi@gmail.com',
            address: 'حي السلام، مراكش',
            birthDate: new Date('2008-01-05'),
            birthPlace: 'مراكش',
            fatherName: 'محمد الأندلسي',
            motherName: 'زينب القرشي',
            parentPhone: '+212674444444',
            parentRelation: 'الوالدة',
            schoolLevel: 'Primaire',
            currentSchool: 'مدرسة النور الابتدائية',
        },
        {
            name: 'عبد الرحمان',
            surname: 'التازي',
            phone: '+212675555555',
            email: 'abderrahmane.tazi@gmail.com',
            address: 'حي الشتوي، تطوان',
            birthDate: new Date('1995-08-18'),
            birthPlace: 'تطوان',
            fatherName: 'حسن التازي',
            motherName: 'أمينة البحراوي',
            parentPhone: '+212675555555',
            parentRelation: 'نفسه',
            schoolLevel: 'تكوين مهني',
            currentSchool: 'متخرج',
        },
    ];

    const createdStudents = [];
    for (const studentData of studentsData) {
        let student = await prisma.student.findFirst({
            where: { email: studentData.email }
        });

        if (!student) {
            student = await prisma.student.create({
                data: {
                    ...studentData,
                    subjects: studentData.schoolLevel === 'Lycée' ? 
                        ['Maths', 'Physique et Chimique', 'S.V.T', 'Français'] :
                        studentData.schoolLevel === 'Collège' ?
                        ['Maths', 'Français', 'Anglais'] :
                        studentData.schoolLevel === 'Primaire' ?
                        ['Calcul Mental', 'Français Communication'] :
                        ['تطوير الويب']
                }
            });
            console.log(`تم إنشاء الطالب: ${studentData.name} ${studentData.surname}`);
        } else {
            console.log(`الطالب موجود مسبقاً: ${studentData.name} ${studentData.surname}`);
        }
        createdStudents.push(student);
    }

    // Create sample groups
    console.log('\nإنشاء المجموعات التجريبية...');
    const groupsData = [
        {
            name: 'مجموعة الرياضيات - الثانوي',
            type: InscriptionType.SOUTIEN,
            level: 'Lycée',
            subject: 'Maths',
            room: 'القاعة A1',
            whatsappUrl: 'https://chat.whatsapp.com/maths-lycee',
            teacherId: createdTeachers[0].id, // أحمد المنصوري
            timeSlots: [
                { day: 'الأحد', startTime: '14:00', endTime: '16:00' },
                { day: 'الثلاثاء', startTime: '16:00', endTime: '18:00' }
            ]
        },
        {
            name: 'مجموعة الفرنسية - الإعدادي',
            type: InscriptionType.SOUTIEN,
            level: 'Collège',
            subject: 'Français',
            room: 'القاعة B2',
            whatsappUrl: 'https://chat.whatsapp.com/francais-college',
            teacherId: createdTeachers[1].id, // فاطمة الزهراء
            timeSlots: [
                { day: 'السبت', startTime: '10:00', endTime: '12:00' },
                { day: 'الأربعاء', startTime: '14:00', endTime: '16:00' }
            ]
        },
        {
            name: 'تكوين التطوير الرقمي - المجموعة الأولى',
            type: InscriptionType.FORMATION,
            formationId: createdFormations[0].id, // التطوير الرقمي
            room: 'مختبر الحاسوب',
            whatsappUrl: 'https://chat.whatsapp.com/dev-formation1',
            teacherId: createdTeachers[3].id, // خديجة العلوي
            timeSlots: [
                { day: 'السبت', startTime: '09:00', endTime: '12:00' },
                { day: 'الأحد', startTime: '09:00', endTime: '12:00' }
            ]
        },
        {
            name: 'مجموعة الحساب الذهني - الابتدائي',
            type: InscriptionType.SOUTIEN,
            level: 'Primaire',
            subject: 'Calcul Mental',
            room: 'القاعة C1',
            whatsappUrl: 'https://chat.whatsapp.com/calcul-primaire',
            teacherId: createdTeachers[1].id, // فاطمة الزهراء
            timeSlots: [
                { day: 'الجمعة', startTime: '15:00', endTime: '16:30' }
            ]
        },
    ];

    const createdGroups = [];
    for (const groupData of groupsData) {
        let group = await prisma.group.findFirst({
            where: { name: groupData.name }
        });

        if (!group) {
            group = await prisma.group.create({
                data: groupData
            });
            console.log(`تم إنشاء المجموعة: ${groupData.name}`);
        } else {
            console.log(`المجموعة موجودة مسبقاً: ${groupData.name}`);
        }
        createdGroups.push(group);
    }

    // Assign students to groups and create inscriptions
    console.log('\nتسجيل الطلاب في المجموعات...');
    
    // محمد بوعزة - ثانوي في الرياضيات
    if (createdStudents[0] && createdGroups[0]) {
        await prisma.student.update({
            where: { id: createdStudents[0].id },
            data: {
                groupIds: [createdGroups[0].id]
            }
        });
        await prisma.group.update({
            where: { id: createdGroups[0].id },
            data: {
                studentIds: [createdStudents[0].id]
            }
        });

        // إنشاء تسجيل
        const existingInscription1 = await prisma.inscription.findFirst({
            where: { studentId: createdStudents[0].id }
        });
        if (!existingInscription1) {
            await prisma.inscription.create({
                data: {
                    studentId: createdStudents[0].id,
                    type: InscriptionType.SOUTIEN,
                    category: 'الرياضيات - الثانوي',
                    amount: 200,
                    note: 'تسجيل في دروس الدعم'
                }
            });
        }

        // إنشاء دفعة أولى
        const existingPayment1 = await prisma.payment.findFirst({
            where: { studentId: createdStudents[0].id }
        });
        if (!existingPayment1) {
            await prisma.payment.create({
                data: {
                    studentId: createdStudents[0].id,
                    amount: 200,
                    method: 'نقداً',
                    note: 'دفعة شهر مارس - الرياضيات'
                }
            });
        }
    }

    // آية المرني - إعدادي في الفرنسية
    if (createdStudents[1] && createdGroups[1]) {
        await prisma.student.update({
            where: { id: createdStudents[1].id },
            data: {
                groupIds: [createdGroups[1].id]
            }
        });
        await prisma.group.update({
            where: { id: createdGroups[1].id },
            data: {
                studentIds: [createdStudents[1].id]
            }
        });

        const existingInscription2 = await prisma.inscription.findFirst({
            where: { studentId: createdStudents[1].id }
        });
        if (!existingInscription2) {
            await prisma.inscription.create({
                data: {
                    studentId: createdStudents[1].id,
                    type: InscriptionType.SOUTIEN,
                    category: 'الفرنسية - الإعدادي',
                    amount: 150,
                    note: 'تسجيل في دروس الدعم'
                }
            });
        }
    }

    // عبد الرحمان التازي - تكوين مهني
    if (createdStudents[4] && createdGroups[2]) {
        await prisma.student.update({
            where: { id: createdStudents[4].id },
            data: {
                groupIds: [createdGroups[2].id]
            }
        });
        await prisma.group.update({
            where: { id: createdGroups[2].id },
            data: {
                studentIds: [createdStudents[4].id]
            }
        });

        const existingInscription3 = await prisma.inscription.findFirst({
            where: { studentId: createdStudents[4].id }
        });
        if (!existingInscription3) {
            await prisma.inscription.create({
                data: {
                    studentId: createdStudents[4].id,
                    type: InscriptionType.FORMATION,
                    category: 'تكوين التطوير الرقمي',
                    amount: 3000,
                    note: 'تسجيل في التكوين المهني'
                }
            });
        }

        const existingPayment3 = await prisma.payment.findFirst({
            where: { studentId: createdStudents[4].id }
        });
        if (!existingPayment3) {
            await prisma.payment.create({
                data: {
                    studentId: createdStudents[4].id,
                    amount: 1500,
                    method: 'تحويل بنكي',
                    note: 'دفعة أولى - تكوين التطوير الرقمي'
                }
            });
        }
    }

    // سارة الأندلسي - ابتدائي
    if (createdStudents[3] && createdGroups[3]) {
        await prisma.student.update({
            where: { id: createdStudents[3].id },
            data: {
                groupIds: [createdGroups[3].id]
            }
        });
        await prisma.group.update({
            where: { id: createdGroups[3].id },
            data: {
                studentIds: [createdStudents[3].id]
            }
        });

        const existingInscription4 = await prisma.inscription.findFirst({
            where: { studentId: createdStudents[3].id }
        });
        if (!existingInscription4) {
            await prisma.inscription.create({
                data: {
                    studentId: createdStudents[3].id,
                    type: InscriptionType.SOUTIEN,
                    category: 'الحساب الذهني - الابتدائي',
                    amount: 100,
                    note: 'تسجيل في دروس الدعم'
                }
            });
        }
    }

    // Create sample attendance records
    console.log('\nإنشاء سجلات الحضور التجريبية...');
    const attendanceData = [
        { studentId: createdStudents[0]?.id, date: new Date('2026-02-25'), status: 'present' },
        { studentId: createdStudents[0]?.id, date: new Date('2026-02-27'), status: 'present' },
        { studentId: createdStudents[1]?.id, date: new Date('2026-02-26'), status: 'present' },
        { studentId: createdStudents[1]?.id, date: new Date('2026-02-28'), status: 'absent' },
        { studentId: createdStudents[4]?.id, date: new Date('2026-03-01'), status: 'present' },
    ];

    for (const attendance of attendanceData) {
        if (attendance.studentId) {
            const existing = await prisma.attendance.findFirst({
                where: {
                    studentId: attendance.studentId,
                    date: attendance.date
                }
            });
            if (!existing) {
                await prisma.attendance.create({
                    data: attendance
                });
            }
        }
    }

    // Create sample transactions
    console.log('\nإنشاء المعاملات المالية التجريبية...');
    const transactionsData = [
        {
            type: TransactionType.INCOME,
            amount: 200,
            category: 'رسوم الدروس',
            description: 'دفع رسوم الرياضيات - محمد بوعزة',
        },
        {
            type: TransactionType.INCOME,
            amount: 1500,
            category: 'رسوم التكوين',
            description: 'دفعة أولى تكوين التطوير الرقمي - عبد الرحمان التازي',
        },
        {
            type: TransactionType.EXPENSE,
            amount: 500,
            category: 'رواتب المعلمين',
            description: 'راتب أستاذ أحمد المنصوري - فبراير 2026',
        },
        {
            type: TransactionType.EXPENSE,
            amount: 300,
            category: 'مصاريف إدارية',
            description: 'فواتير الكهرباء والماء',
        },
        {
            type: TransactionType.INCOME,
            amount: 450,
            category: 'رسوم الدروس',
            description: 'مدفوعات متنوعة - فبراير 2026',
        },
    ];

    for (const transaction of transactionsData) {
        const existing = await prisma.transaction.findFirst({
            where: { 
                amount: transaction.amount,
                description: transaction.description 
            }
        });
        if (!existing) {
            await prisma.transaction.create({
                data: transaction
            });
        }
    }

    // Add school settings
    console.log('\nإنشاء إعدادات المدرسة...');
    const existingSettings = await prisma.settings.findFirst();
    if (!existingSettings) {
        await prisma.settings.create({
            data: {
                schoolName: 'معهد Enovazone Acadimeca للتطوير والتكوين',
                academicYear: '2025-2026',
                contactInfo: JSON.stringify({
                    email: 'contact@enovazoneacadimeca.com',
                    phone: '+212600000000',
                    address: 'شارع محمد الخامس، الدار البيضاء، المغرب',
                    website: 'https://arwaeduc.enovazoneacadimeca.com'
                })
            }
        });
        console.log('تم إنشاء إعدادات المدرسة');
    }

    // Create default pricing
    const pricingItems = [
        // LYCEE
        { category: 'SOUTIEN', level: 'Lycée', subject: 'Maths', price: 200 },
        { category: 'SOUTIEN', level: 'Lycée', subject: 'Physique et Chimique', price: 200 },
        { category: 'SOUTIEN', level: 'Lycée', subject: 'S.V.T', price: 200 },
        { category: 'SOUTIEN', level: 'Lycée', subject: 'Anglais', price: 150 },
        { category: 'SOUTIEN', level: 'Lycée', subject: 'Français', price: 150 },

        // COLLEGE
        { category: 'SOUTIEN', level: 'Collège', subject: 'Maths', price: 150 },
        { category: 'SOUTIEN', level: 'Collège', subject: 'Physique et Chimique', price: 150 },
        { category: 'SOUTIEN', level: 'Collège', subject: 'S.V.T', price: 150 },
        { category: 'SOUTIEN', level: 'Collège', subject: 'Anglais', price: 100 },

        // PRIMAIRE
        { category: 'SOUTIEN', level: 'Primaire', subject: 'Maths', price: 100 },
        { category: 'SOUTIEN', level: 'Primaire', subject: 'Français', price: 100 },
        { category: 'SOUTIEN', level: 'Primaire', subject: 'Français Communication', price: 100 },
        { category: 'SOUTIEN', level: 'Primaire', subject: 'Calcul Mental', price: 100 },
    ];

    console.log('\nCreating default pricing...');
    for (const item of pricingItems) {
        // Upsert based on composite key logic if possible, or just create if not exists
        // Since we don't have a unique constraint on (category, level, subject) easy to use here without ID,
        // we'll check first.
        const existing = await prisma.pricing.findFirst({
            where: {
                level: item.level,
                subject: item.subject,
                category: item.category
            }
        });

        if (!existing) {
            await prisma.pricing.create({
                data: {
                    ...item,
                    active: true
                }
            });
            console.log(`Created pricing: ${item.level} - ${item.subject}`);
        } else {
            console.log(`Pricing already exists: ${item.level} - ${item.subject}`);
        }
    }

    console.log('\n✅ Database seed completed!');
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
