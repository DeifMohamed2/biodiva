#!/usr/bin/env node

/**
 * Export Students Data to Excel Script
 * 
 * This script exports all student information to an Excel file including:
 * - Student Name
 * - Student Code
 * - Phone Number
 * - Parent Phone Number
 * - Governorate (gov)
 * - City/Area (Markez)
 * - Grade
 * - Gender
 * - Place (online/center)
 * - Language (AR/EN)
 * - Registration Date
 * - Last Login
 * - Active Status
 * - Total Score
 * - Exams Entered
 * - Subscription Status
 * 
 * Usage: node scripts/exportStudentsToExcel.js
 * Options:
 *   --grade=Grade1|Grade2|Grade3  Filter by grade
 *   --gov=governorate             Filter by governorate
 *   --place=online|center         Filter by place
 *   --active=true|false           Filter by active status
 */

const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const path = require('path');

// Database connection
const dbURI = 'mongodb+srv://deif:1qaz2wsx@3devway.aa4i6ga.mongodb.net/biodiva2025?retryWrites=true&w=majority&appName=Cluster0';

// Parse command line arguments
function parseArgs() {
    const args = {};
    process.argv.slice(2).forEach(arg => {
        if (arg.startsWith('--')) {
            const [key, value] = arg.slice(2).split('=');
            args[key] = value;
        }
    });
    return args;
}

// Build filter based on command line arguments
function buildFilter(args) {
    const filter = { isTeacher: false }; // Only students
    
    if (args.grade) {
        filter.Grade = args.grade;
    }
    if (args.gov) {
        filter.gov = new RegExp(args.gov, 'i');
    }
    if (args.place) {
        filter.place = args.place;
    }
    if (args.active !== undefined) {
        filter.isActive = args.active === 'true';
    }
    
    return filter;
}

// Format date for Excel
function formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format phone number for better readability
function formatPhone(phone) {
    if (!phone) return 'N/A';
    // Ensure phone starts with country code or format properly
    return phone.toString();
}

// Translate grade to Arabic
function translateGrade(grade) {
    const gradeMap = {
        'Grade1': 'الصف الأول الثانوي',
        'Grade2': 'الصف الثاني الثانوي',
        'Grade3': 'الصف الثالث الثانوي'
    };
    return gradeMap[grade] || grade;
}

// Translate gender to Arabic
function translateGender(gender) {
    const genderMap = {
        'male': 'ذكر',
        'female': 'أنثى'
    };
    return genderMap[gender] || gender;
}

// Translate place to Arabic
function translatePlace(place) {
    const placeMap = {
        'online': 'أونلاين',
        'center': 'سنتر'
    };
    return placeMap[place] || place;
}

// Translate language
function translateLanguage(lang) {
    const langMap = {
        'AR': 'عربي',
        'EN': 'إنجليزي'
    };
    return langMap[lang] || lang;
}

async function exportStudentsToExcel() {
    console.log('🚀 Starting Student Data Export to Excel...\n');
    
    const args = parseArgs();
    const filter = buildFilter(args);
    
    console.log('📋 Filter applied:', JSON.stringify(filter, null, 2), '\n');
    
    try {
        // Connect to database
        console.log('🔌 Connecting to database...');
        await mongoose.connect(dbURI, { 
            useNewUrlParser: true, 
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ Database connected successfully!\n');
        
        // Load User model
        const User = require('../models/User');
        
        // Fetch students
        console.log('📚 Fetching student data...');
        const students = await User.find(filter)
            .select({
                Username: 1,
                Code: 1,
                phone: 1,
                parentPhone: 1,
                gov: 1,
                Markez: 1,
                Grade: 1,
                gender: 1,
                place: 1,
                ARorEN: 1,
                subscribe: 1,
                isActive: 1,
                totalScore: 1,
                examsEnterd: 1,
                totalQuestions: 1,
                registrationDate: 1,
                lastLogin: 1,
                createdAt: 1
            })
            .sort({ Code: 1 })
            .lean();
        
        console.log(`✅ Found ${students.length} students\n`);
        
        if (students.length === 0) {
            console.log('⚠️ No students found with the given filter.');
            await mongoose.disconnect();
            return;
        }
        
        // Create workbook
        console.log('📊 Creating Excel file...');
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'BioDiva System';
        workbook.created = new Date();
        
        // Create main sheet
        const worksheet = workbook.addWorksheet('بيانات الطلاب', {
            properties: { rightToLeft: true },
            views: [{ state: 'frozen', ySplit: 1 }]
        });
        
        // Define columns with Arabic headers
        worksheet.columns = [
            { header: 'م', key: 'index', width: 8 },
            { header: 'كود الطالب', key: 'code', width: 12 },
            { header: 'اسم الطالب', key: 'name', width: 30 },
            { header: 'رقم الهاتف', key: 'phone', width: 18 },
            { header: 'رقم ولي الأمر', key: 'parentPhone', width: 18 },
            { header: 'المحافظة', key: 'gov', width: 15 },
            { header: 'المركز/المدينة', key: 'markez', width: 18 },
            { header: 'الصف الدراسي', key: 'grade', width: 20 },
            { header: 'النوع', key: 'gender', width: 10 },
            { header: 'نوع الاشتراك', key: 'place', width: 12 },
            { header: 'اللغة', key: 'language', width: 10 },
            { header: 'حالة الاشتراك', key: 'subscribe', width: 12 },
            { header: 'الحالة', key: 'isActive', width: 10 },
            { header: 'إجمالي الدرجات', key: 'totalScore', width: 15 },
            { header: 'عدد الامتحانات', key: 'examsEnterd', width: 15 },
            { header: 'تاريخ التسجيل', key: 'registrationDate', width: 20 },
            { header: 'آخر دخول', key: 'lastLogin', width: 20 }
        ];
        
        // Style header row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2E7D32' } // Green background
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 25;
        
        // Add student data
        students.forEach((student, index) => {
            const row = worksheet.addRow({
                index: index + 1,
                code: student.Code,
                name: student.Username,
                phone: formatPhone(student.phone),
                parentPhone: formatPhone(student.parentPhone),
                gov: student.gov,
                markez: student.Markez,
                grade: translateGrade(student.Grade),
                gender: translateGender(student.gender),
                place: translatePlace(student.place),
                language: translateLanguage(student.ARorEN),
                subscribe: student.subscribe ? 'مشترك' : 'غير مشترك',
                isActive: student.isActive ? 'نشط' : 'غير نشط',
                totalScore: student.totalScore || 0,
                examsEnterd: student.examsEnterd || 0,
                registrationDate: formatDate(student.registrationDate || student.createdAt),
                lastLogin: formatDate(student.lastLogin)
            });
            
            // Alternate row colors
            if (index % 2 === 0) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF5F5F5' }
                };
            }
            
            // Center alignment for specific columns
            row.getCell('index').alignment = { horizontal: 'center' };
            row.getCell('code').alignment = { horizontal: 'center' };
            row.getCell('phone').alignment = { horizontal: 'center' };
            row.getCell('parentPhone').alignment = { horizontal: 'center' };
            row.getCell('gender').alignment = { horizontal: 'center' };
            row.getCell('place').alignment = { horizontal: 'center' };
            row.getCell('language').alignment = { horizontal: 'center' };
            row.getCell('subscribe').alignment = { horizontal: 'center' };
            row.getCell('isActive').alignment = { horizontal: 'center' };
            row.getCell('totalScore').alignment = { horizontal: 'center' };
            row.getCell('examsEnterd').alignment = { horizontal: 'center' };
        });
        
        // Add borders to all cells
        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });
        
        // Create summary sheet
        const summarySheet = workbook.addWorksheet('ملخص الإحصائيات', {
            properties: { rightToLeft: true }
        });
        
        // Calculate statistics
        const stats = {
            total: students.length,
            male: students.filter(s => s.gender === 'male').length,
            female: students.filter(s => s.gender === 'female').length,
            online: students.filter(s => s.place === 'online').length,
            center: students.filter(s => s.place === 'center').length,
            grade1: students.filter(s => s.Grade === 'Grade1').length,
            grade2: students.filter(s => s.Grade === 'Grade2').length,
            grade3: students.filter(s => s.Grade === 'Grade3').length,
            active: students.filter(s => s.isActive).length,
            subscribed: students.filter(s => s.subscribe).length
        };
        
        // Add summary data
        summarySheet.columns = [
            { header: 'الإحصائية', key: 'stat', width: 25 },
            { header: 'العدد', key: 'count', width: 15 }
        ];
        
        const summaryHeaderRow = summarySheet.getRow(1);
        summaryHeaderRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        summaryHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1565C0' }
        };
        
        summarySheet.addRow({ stat: 'إجمالي عدد الطلاب', count: stats.total });
        summarySheet.addRow({ stat: 'عدد الطلاب الذكور', count: stats.male });
        summarySheet.addRow({ stat: 'عدد الطالبات الإناث', count: stats.female });
        summarySheet.addRow({ stat: 'طلاب أونلاين', count: stats.online });
        summarySheet.addRow({ stat: 'طلاب السنتر', count: stats.center });
        summarySheet.addRow({ stat: 'الصف الأول الثانوي', count: stats.grade1 });
        summarySheet.addRow({ stat: 'الصف الثاني الثانوي', count: stats.grade2 });
        summarySheet.addRow({ stat: 'الصف الثالث الثانوي', count: stats.grade3 });
        summarySheet.addRow({ stat: 'الطلاب النشطين', count: stats.active });
        summarySheet.addRow({ stat: 'الطلاب المشتركين', count: stats.subscribed });
        
        // Style summary sheet
        summarySheet.eachRow((row, rowNumber) => {
            row.alignment = { horizontal: 'center', vertical: 'middle' };
            row.height = 22;
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });
        
        // Create Governorate breakdown sheet
        const govSheet = workbook.addWorksheet('توزيع المحافظات', {
            properties: { rightToLeft: true }
        });
        
        // Calculate governorate statistics
        const govStats = {};
        students.forEach(s => {
            if (s.gov) {
                govStats[s.gov] = (govStats[s.gov] || 0) + 1;
            }
        });
        
        govSheet.columns = [
            { header: 'م', key: 'index', width: 8 },
            { header: 'المحافظة', key: 'gov', width: 25 },
            { header: 'عدد الطلاب', key: 'count', width: 15 },
            { header: 'النسبة المئوية', key: 'percentage', width: 15 }
        ];
        
        const govHeaderRow = govSheet.getRow(1);
        govHeaderRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        govHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF6A1B9A' }
        };
        
        Object.entries(govStats)
            .sort((a, b) => b[1] - a[1])
            .forEach(([gov, count], index) => {
                govSheet.addRow({
                    index: index + 1,
                    gov: gov,
                    count: count,
                    percentage: `${((count / stats.total) * 100).toFixed(1)}%`
                });
            });
        
        // Style governorate sheet
        govSheet.eachRow((row) => {
            row.alignment = { horizontal: 'center', vertical: 'middle' };
            row.height = 22;
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const filename = `students_data_${timestamp}.xlsx`;
        const filepath = path.join(__dirname, '..', 'exports', filename);
        
        // Create exports directory if it doesn't exist
        const fs = require('fs');
        const exportsDir = path.join(__dirname, '..', 'exports');
        if (!fs.existsSync(exportsDir)) {
            fs.mkdirSync(exportsDir, { recursive: true });
        }
        
        // Save file
        await workbook.xlsx.writeFile(filepath);
        
        console.log('✅ Excel file created successfully!');
        console.log(`📁 File saved to: ${filepath}\n`);
        
        // Print summary
        console.log('📊 Export Summary:');
        console.log('─'.repeat(40));
        console.log(`   إجمالي الطلاب: ${stats.total}`);
        console.log(`   الذكور: ${stats.male} | الإناث: ${stats.female}`);
        console.log(`   أونلاين: ${stats.online} | سنتر: ${stats.center}`);
        console.log(`   الصف الأول: ${stats.grade1} | الثاني: ${stats.grade2} | الثالث: ${stats.grade3}`);
        console.log('─'.repeat(40));
        
    } catch (error) {
        console.error('❌ Error exporting students:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Database disconnected');
    }
}

// Run the export
if (require.main === module) {
    exportStudentsToExcel().catch(error => {
        console.error('💥 Export failed:', error);
        process.exit(1);
    });
}

module.exports = { exportStudentsToExcel };
