# frozen_string_literal: true

module Decidim
  module Budgets
    module Admin
      class Permissions < Decidim::DefaultPermissions
        def permissions
          return permission_action if permission_action.scope != :admin
          return permission_action unless user&.admin?

          allow! if can_access?
          allow! if can_import_projects?

          case permission_action.subject
          when :budget
            case permission_action.action
            when :create, :read, :export
              allow!
            when :update
              toggle_allow(budget)
            when :delete, :publish, :unpublish
              toggle_allow(budget && budget.projects.empty?)
            end
          when :project, :projects
            case permission_action.action
            when :create, :import_proposals, :project_category
              permission_action.allow!
            when :update, :destroy
              permission_action.allow! if project.present?
            end
          when :order
            case permission_action.action
            when :remind
              permission_action.allow!
            end
          when :project_category, :project_scope, :project_selected
            permission_action.allow!
          end

          permission_action
        end

        private

        def can_access?
          permission_action.subject == :budgets_importer &&
            permission_action.action == :read
        end

        def can_import_projects?
          permission_action.subject == :projects &&
            permission_action.action == :import
        end

        def budget
          @budget ||= context.fetch(:budget, nil)
        end

        def project
          @project ||= context.fetch(:project, nil)
        end
      end
    end
  end
end
