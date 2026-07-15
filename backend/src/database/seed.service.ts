import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { User } from './entities/user.entity';
import { Asset } from './entities/asset.entity';
import { hashPassword } from '../auth/hash.util';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
  ) {}

  async onApplicationBootstrap() {
    const deptCount = await this.departmentRepo.count();
    if (deptCount > 0) {
      console.log('Database already seeded.');
      return;
    }

    console.log('Seeding database with default Meridian University data...');

    const deptsData = [
      { name: 'Chemistry', faculty: 'Science' },
      { name: 'Physics', faculty: 'Science' },
      { name: 'Biology', faculty: 'Science' },
      { name: 'Computer Science', faculty: 'Engineering' },
      { name: 'Mechanical Engineering', faculty: 'Engineering' },
      { name: 'Electrical Engineering', faculty: 'Engineering' },
      { name: 'Arts', faculty: 'Humanities' },
      { name: 'History', faculty: 'Humanities' },
    ];

    const depts = {};
    for (const d of deptsData) {
      const dept = this.departmentRepo.create(d);
      depts[d.name] = await this.departmentRepo.save(dept);
    }

    const usersData = [
      {
        email: 'admin@meridian.edu',
        passwordHash: hashPassword('admin123'),
        role: 'admin',
        departmentName: 'Computer Science',
        faculty: 'Engineering',
        reputationScore: 5.0,
      },
      {
        email: 'chem_manager@meridian.edu',
        passwordHash: hashPassword('manager123'),
        role: 'staff',
        departmentName: 'Chemistry',
        faculty: 'Science',
        reputationScore: 5.0,
      },
      {
        email: 'cs_manager@meridian.edu',
        passwordHash: hashPassword('manager123'),
        role: 'staff',
        departmentName: 'Computer Science',
        faculty: 'Engineering',
        reputationScore: 5.0,
      },
      {
        email: 'student_cs@meridian.edu',
        passwordHash: hashPassword('student123'),
        role: 'student',
        departmentName: 'Computer Science',
        faculty: 'Engineering',
        reputationScore: 4.85,
      },
      {
        email: 'student_chem@meridian.edu',
        passwordHash: hashPassword('student123'),
        role: 'student',
        departmentName: 'Chemistry',
        faculty: 'Science',
        reputationScore: 4.90,
      },
      {
        email: 'student_arts@meridian.edu',
        passwordHash: hashPassword('student123'),
        role: 'student',
        departmentName: 'Arts',
        faculty: 'Humanities',
        reputationScore: 5.0,
      },
      {
        email: 'lfofficer@meridian.edu',
        passwordHash: hashPassword('officer123'),
        role: 'lfofficer',
        departmentName: 'Computer Science',
        faculty: 'Engineering',
        reputationScore: 5.0,
      },
    ];

    for (const u of usersData) {
      const dept = depts[u.departmentName];
      const user = this.userRepo.create({
        email: u.email,
        passwordHash: u.passwordHash,
        role: u.role,
        departmentId: dept ? dept.id : null,
        faculty: u.faculty,
        reputationScore: u.reputationScore,
      });
      await this.userRepo.save(user);
    }

    const assetsData = [
      {
        name: 'Spectrometer Model S20',
        description: 'High-precision analytical chemistry spectrometer used for molecular analysis.',
        category: 'equipment',
        departmentName: 'Chemistry',
        condition: 'excellent',
        status: 'available',
        bookingLeadTime: 0,
        isHighValue: true,
        photoUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=500',
      },
      {
        name: 'Sony DSLR Camera A7III',
        description: 'Full-frame mirrorless camera with 28-70mm lens, great for documentary and project recording.',
        category: 'equipment',
        departmentName: 'Computer Science',
        condition: 'good',
        status: 'available',
        bookingLeadTime: 2,
        isHighValue: false,
        photoUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500',
      },
      {
        name: 'Oculus Quest 3 VR Headset',
        description: 'All-in-one virtual reality headset for research and software development.',
        category: 'equipment',
        departmentName: 'Computer Science',
        condition: 'excellent',
        status: 'available',
        bookingLeadTime: 0,
        isHighValue: true,
        photoUrl: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=500',
      },
      {
        name: 'Collaborative Study Lab 202',
        description: 'Group study room with interactive whiteboard, projector, and seating for up to 8 students.',
        category: 'room',
        departmentName: 'Computer Science',
        condition: 'excellent',
        status: 'available',
        bookingLeadTime: 1,
        isHighValue: false,
        photoUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=500',
      },
      {
        name: 'Seminar Room 101',
        description: 'Medium seminar room with 30 chairs, podium, and integrated sound system.',
        category: 'room',
        departmentName: 'Arts',
        condition: 'excellent',
        status: 'available',
        bookingLeadTime: 0,
        isHighValue: false,
        photoUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=500',
      },
      {
        name: 'Meridian Cruiser Bike #4',
        description: 'Single-speed campus cruiser bicycle with front basket, perfect for local transit.',
        category: 'loanable',
        departmentName: 'Chemistry',
        condition: 'fair',
        status: 'available',
        bookingLeadTime: 0,
        isHighValue: false,
        photoUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500',
      },
    ];

    for (const a of assetsData) {
      const dept = depts[a.departmentName];
      const asset = this.assetRepo.create({
        name: a.name,
        description: a.description,
        category: a.category,
        departmentId: dept ? dept.id : null,
        condition: a.condition,
        status: a.status,
        bookingLeadTime: a.bookingLeadTime,
        isHighValue: a.isHighValue,
        photoUrl: a.photoUrl,
      });
      await this.assetRepo.save(asset);
    }
    console.log('Database seeding successfully completed.');
  }
}