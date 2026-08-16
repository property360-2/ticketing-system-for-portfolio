using HelpDesk.Api.Models.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace HelpDesk.Api.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Department> Departments => Set<Department>();

    public DbSet<Category> Categories => Set<Category>();

    public DbSet<Ticket> Tickets => Set<Ticket>();

    public DbSet<TicketComment> TicketComments => Set<TicketComment>();

    public DbSet<TicketAttachment> TicketAttachments => Set<TicketAttachment>();

    public DbSet<TicketActivityLog> TicketActivityLogs => Set<TicketActivityLog>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Department>(entity =>
        {
            entity.HasIndex(d => d.Name).IsUnique();
            entity.Property(d => d.Name).HasMaxLength(100);
        });

        builder.Entity<Category>(entity =>
        {
            entity.HasIndex(c => c.Name).IsUnique();
            entity.Property(c => c.Name).HasMaxLength(100);
        });

        builder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(u => u.Name).HasMaxLength(150);

            entity.HasOne(u => u.Department)
                .WithMany(d => d.Users)
                .HasForeignKey(u => u.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Ticket>(entity =>
        {
            entity.Property(t => t.Title).HasMaxLength(200);
            entity.HasIndex(t => t.Status);
            entity.HasIndex(t => t.Priority);
            entity.HasIndex(t => t.CreatedById);

            entity.HasOne(t => t.CreatedBy)
                .WithMany(u => u.CreatedTickets)
                .HasForeignKey(t => t.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(t => t.AssignedTo)
                .WithMany(u => u.AssignedTickets)
                .HasForeignKey(t => t.AssignedToId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(t => t.Category)
                .WithMany(c => c.Tickets)
                .HasForeignKey(t => t.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(t => t.Department)
                .WithMany(d => d.Tickets)
                .HasForeignKey(t => t.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<TicketComment>(entity =>
        {
            entity.Property(c => c.Content).HasMaxLength(4000);

            entity.HasOne(c => c.Ticket)
                .WithMany(t => t.Comments)
                .HasForeignKey(c => c.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(c => c.User)
                .WithMany(u => u.Comments)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<TicketAttachment>(entity =>
        {
            entity.Property(a => a.FileName).HasMaxLength(255);
            entity.Property(a => a.FilePath).HasMaxLength(500);
            entity.Property(a => a.MimeType).HasMaxLength(100);

            entity.HasOne(a => a.Ticket)
                .WithMany(t => t.Attachments)
                .HasForeignKey(a => a.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.UploadedBy)
                .WithMany(u => u.Attachments)
                .HasForeignKey(a => a.UploadedById)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<TicketActivityLog>(entity =>
        {
            entity.Property(l => l.OldValue).HasMaxLength(100);
            entity.Property(l => l.NewValue).HasMaxLength(100);
            entity.HasIndex(l => l.Action);

            entity.HasOne(l => l.Ticket)
                .WithMany(t => t.ActivityLogs)
                .HasForeignKey(l => l.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(l => l.User)
                .WithMany(u => u.ActivityLogs)
                .HasForeignKey(l => l.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}