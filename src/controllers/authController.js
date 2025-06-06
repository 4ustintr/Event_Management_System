require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { connection } = require('../config/database');

const register = async (req, res) => {
    try {
        const { email, password, full_name, phone, roles } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu email, password hoặc full_name'
            });
        }

        // Validate và normalize roles
        if (!roles) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin vai trò (roles)'
            });
        }

        // Convert single role to array if needed
        let roleArray;
        if (typeof roles === 'string') {
            roleArray = [roles];
        } else if (Array.isArray(roles)) {
            roleArray = roles;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Vai trò phải là string hoặc array'
            });
        }

        if (roleArray.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Phải có ít nhất một vai trò'
            });
        }

        // Map Vietnamese to English role names
        const roleMapping = {
            'sinh viên': 'student',
            'sinh_vien': 'student',
            'student': 'student',
            'câu lạc bộ': 'club',
            'cau_lac_bo': 'club',
            'club': 'club',
            'clb': 'club',
            'quản trị viên': 'admin',
            'quan_tri_vien': 'admin',
            'admin': 'admin'
        };

        const normalizedRole = roleMapping[roleArray[0].toLowerCase()];
        if (!normalizedRole) {
            return res.status(400).json({
                success: false,
                message: `Vai trò không hợp lệ. Các vai trò được hỗ trợ: student/sinh viên, club/câu lạc bộ, admin/quản trị viên`
            });
        }

        // Validate club email format
        if (normalizedRole === 'club' && !email.endsWith('@club.clb')) {
            return res.status(400).json({
                success: false,
                message: 'Email của CLB phải có đuôi @club.clb'
            });
        }

        const db = await connection();
        const usersCollection = db.collection('users');

        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email đã được đăng ký trước đó'
            });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create role object based on normalized role
        let roleObject;
        if (normalizedRole === 'student') {
            roleObject = {
                role_id: uuidv4(),
                role_name: 'student',
                description: 'Sinh viên'
            };
        } else if (normalizedRole === 'club') {
            roleObject = {
                role_id: uuidv4(),
                role_name: 'club',
                description: 'Câu lạc bộ'
            };
        } else if (normalizedRole === 'admin') {
            roleObject = {
                role_id: uuidv4(),
                role_name: 'admin',
                description: 'Quản trị viên'
            };
        }

        const now = new Date();
        const newUser = {
            email,
            password: hashedPassword,
            full_name,
            phone: phone || '',
            roles: [roleObject],
            clubs: [],
            created_at: now,
            updated_at: now
        };

        console.log('📝 Creating new user:', { email, role: normalizedRole, full_name });
        const result = await usersCollection.insertOne(newUser);
        console.log('✅ User created with ID:', result.insertedId.toString());

        // Generate JWT token for auto-login
        const payload = { id: result.insertedId.toString() };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        const userResponse = {
            _id: result.insertedId.toString(),
            email: newUser.email,
            full_name: newUser.full_name,
            phone: newUser.phone,
            roles: newUser.roles.map(r => ({
                role_id: r.role_id,
                role_name: r.role_name,
                description: r.description
            })),
            clubs: [],
            created_at: newUser.created_at.toISOString(),
            updated_at: newUser.updated_at.toISOString()
        };

        return res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            data: {
                token,
                user: userResponse
            }
        });
    } catch (err) {
        console.error('❌ Lỗi khi register:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu email hoặc password'
            });
        }

        const db = await connection();
        const usersCollection = db.collection('users');

        const userDoc = await usersCollection.findOne({ email });
        if (!userDoc) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không chính xác'
            });
        }

        const isMatch = await bcrypt.compare(password, userDoc.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không chính xác'
            });
        }

        const payload = { id: userDoc._id.toString() };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        const userResponse = {
            _id: userDoc._id.toString(),
            email: userDoc.email,
            full_name: userDoc.full_name || '',
            phone: userDoc.phone || '',
            roles: Array.isArray(userDoc.roles)
                ? userDoc.roles.map(r => ({
                    role_id: r.role_id?.toString ? r.role_id.toString() : r.role_id,
                    role_name: r.role_name,
                    description: r.description
                }))
                : [],
            clubs: Array.isArray(userDoc.clubs)
                ? userDoc.clubs.map(c => ({
                    club_id: c.club_id?.toString ? c.club_id.toString() : c.club_id,
                    club_name: c.club_name,
                    role_in_club: c.role_in_club
                }))
                : [],
            created_at: userDoc.created_at ? userDoc.created_at.toISOString() : null,
            updated_at: userDoc.updated_at ? userDoc.updated_at.toISOString() : null
        };

        return res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                token,
                user: userResponse
            }
        });
    } catch (err) {
        console.error('❌ Lỗi khi login:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

module.exports = {
    register,
    login
}; 