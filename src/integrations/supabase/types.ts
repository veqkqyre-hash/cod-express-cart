export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          details: Json
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          content_en: string | null
          content_sq: string | null
          cover_image: string | null
          created_at: string
          excerpt_en: string | null
          excerpt_sq: string | null
          id: string
          published: boolean
          slug: string
          title_en: string
          title_sq: string
          updated_at: string
        }
        Insert: {
          content_en?: string | null
          content_sq?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt_en?: string | null
          excerpt_sq?: string | null
          id?: string
          published?: boolean
          slug: string
          title_en: string
          title_sq: string
          updated_at?: string
        }
        Update: {
          content_en?: string | null
          content_sq?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt_en?: string | null
          excerpt_sq?: string | null
          id?: string
          published?: boolean
          slug?: string
          title_en?: string
          title_sq?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name_en: string
          name_sq: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name_en: string
          name_sq: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name_en?: string
          name_sq?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          min_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          min_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          min_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      homepage_slides: {
        Row: {
          active: boolean
          created_at: string
          id: string
          image_url: string | null
          link_url: string | null
          sort_order: number
          subtitle_en: string | null
          subtitle_sq: string | null
          title_en: string
          title_sq: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          sort_order?: number
          subtitle_en?: string | null
          subtitle_sq?: string | null
          title_en?: string
          title_sq?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          sort_order?: number
          subtitle_en?: string | null
          subtitle_sq?: string | null
          title_en?: string
          title_sq?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          read: boolean
          subject: string | null
        }
        Insert: {
          body: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          read?: boolean
          subject?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          read?: boolean
          subject?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          lang: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id?: string
          lang?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          lang?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          order_id: string | null
          order_number: string | null
          read: boolean
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          order_id?: string | null
          order_number?: string | null
          read?: boolean
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          order_id?: string | null
          order_number?: string | null
          read?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          city: string
          created_at: string
          customer_name: string
          email: string | null
          id: string
          notes: string | null
          order_number: string
          payment_method: string
          phone: string
          postal_code: string | null
          shipping_fee: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          customer_name: string
          email?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string
          phone: string
          postal_code?: string | null
          shipping_fee?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          customer_name?: string
          email?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string
          phone?: string
          postal_code?: string | null
          shipping_fee?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pos_refund_items: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          product_name: string
          quantity: number
          refund_id: string
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          product_name: string
          quantity: number
          refund_id: string
          subtotal?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          refund_id?: string
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_refund_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_refund_items_refund_id_fkey"
            columns: ["refund_id"]
            isOneToOne: false
            referencedRelation: "pos_refunds"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_refunds: {
        Row: {
          cashier_email: string | null
          cashier_id: string | null
          created_at: string
          id: string
          item_count: number
          reason: string | null
          refund_number: string
          sale_id: string | null
          sale_number: string | null
          total: number
        }
        Insert: {
          cashier_email?: string | null
          cashier_id?: string | null
          created_at?: string
          id?: string
          item_count?: number
          reason?: string | null
          refund_number?: string
          sale_id?: string | null
          sale_number?: string | null
          total?: number
        }
        Update: {
          cashier_email?: string | null
          cashier_id?: string | null
          created_at?: string
          id?: string
          item_count?: number
          reason?: string | null
          refund_number?: string
          sale_id?: string | null
          sale_number?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_refunds_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "pos_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sale_items: {
        Row: {
          barcode: string | null
          created_at: string
          id: string
          product_id: string | null
          product_name: string
          quantity: number
          sale_id: string
          subtotal: number
          unit_cost: number
          unit_price: number
        }
        Insert: {
          barcode?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
          product_name: string
          quantity: number
          sale_id: string
          subtotal: number
          unit_cost?: number
          unit_price: number
        }
        Update: {
          barcode?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          sale_id?: string
          subtotal?: number
          unit_cost?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "pos_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sales: {
        Row: {
          cashier_email: string | null
          cashier_id: string | null
          change_amount: number | null
          cost_total: number
          created_at: string
          customer_name: string | null
          discount: number
          id: string
          item_count: number
          note: string | null
          paid_amount: number | null
          payment_method: string
          sale_number: string
          shift_id: string | null
          total: number
        }
        Insert: {
          cashier_email?: string | null
          cashier_id?: string | null
          change_amount?: number | null
          cost_total?: number
          created_at?: string
          customer_name?: string | null
          discount?: number
          id?: string
          item_count?: number
          note?: string | null
          paid_amount?: number | null
          payment_method?: string
          sale_number?: string
          shift_id?: string | null
          total?: number
        }
        Update: {
          cashier_email?: string | null
          cashier_id?: string | null
          change_amount?: number | null
          cost_total?: number
          created_at?: string
          customer_name?: string | null
          discount?: number
          id?: string
          item_count?: number
          note?: string | null
          paid_amount?: number | null
          payment_method?: string
          sale_number?: string
          shift_id?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_sales_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "pos_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_shifts: {
        Row: {
          card_sales: number
          cash_sales: number
          closed_at: string | null
          closed_by: string | null
          closed_email: string | null
          counted_cash: number | null
          created_at: string
          difference: number | null
          expected_cash: number | null
          id: string
          note: string | null
          opened_at: string
          opened_by: string | null
          opened_email: string | null
          opening_cash: number
          other_sales: number
          sales_count: number
          status: string
          updated_at: string
        }
        Insert: {
          card_sales?: number
          cash_sales?: number
          closed_at?: string | null
          closed_by?: string | null
          closed_email?: string | null
          counted_cash?: number | null
          created_at?: string
          difference?: number | null
          expected_cash?: number | null
          id?: string
          note?: string | null
          opened_at?: string
          opened_by?: string | null
          opened_email?: string | null
          opening_cash?: number
          other_sales?: number
          sales_count?: number
          status?: string
          updated_at?: string
        }
        Update: {
          card_sales?: number
          cash_sales?: number
          closed_at?: string | null
          closed_by?: string | null
          closed_email?: string | null
          counted_cash?: number | null
          created_at?: string
          difference?: number | null
          expected_cash?: number | null
          id?: string
          note?: string | null
          opened_at?: string
          opened_by?: string | null
          opened_email?: string | null
          opening_cash?: number
          other_sales?: number
          sales_count?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          approved: boolean
          author_name: string
          body: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          title: string | null
          user_id: string | null
        }
        Insert: {
          approved?: boolean
          author_name: string
          body?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating?: number
          title?: string | null
          user_id?: string | null
        }
        Update: {
          approved?: boolean
          author_name?: string
          body?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          barcode: string | null
          category_id: string | null
          cost_price: number
          created_at: string
          description_en: string | null
          description_sq: string | null
          featured: boolean
          id: string
          image_url: string | null
          name_en: string
          name_sq: string
          price: number
          sku: string | null
          slug: string
          stock: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          barcode?: string | null
          category_id?: string | null
          cost_price?: number
          created_at?: string
          description_en?: string | null
          description_sq?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          name_en: string
          name_sq: string
          price: number
          sku?: string | null
          slug: string
          stock?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          barcode?: string | null
          category_id?: string | null
          cost_price?: number
          created_at?: string
          description_en?: string | null
          description_sq?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          name_en?: string
          name_sq?: string
          price?: number
          sku?: string | null
          slug?: string
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_rates: {
        Row: {
          active: boolean
          created_at: string
          fee: number
          free_over: number | null
          id: string
          updated_at: string
          zone: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          fee?: number
          free_over?: number | null
          id?: string
          updated_at?: string
          zone: string
        }
        Update: {
          active?: boolean
          created_at?: string
          fee?: number
          free_over?: number | null
          id?: string
          updated_at?: string
          zone?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      stock_alerts: {
        Row: {
          created_at: string
          email: string
          id: string
          notified: boolean
          product_id: string | null
          product_name: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          notified?: boolean
          product_id?: string | null
          product_name?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          notified?: boolean
          product_id?: string | null
          product_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_refills: {
        Row: {
          added: number
          created_at: string
          id: string
          new_stock: number
          old_stock: number
          product_id: string
          product_name: string | null
          user_id: string | null
        }
        Insert: {
          added: number
          created_at?: string
          id?: string
          new_stock: number
          old_stock: number
          product_id: string
          product_name?: string | null
          user_id?: string | null
        }
        Update: {
          added?: number
          created_at?: string
          id?: string
          new_stock?: number
          old_stock?: number
          product_id?: string
          product_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visitor_logs: {
        Row: {
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          device: string | null
          id: string
          ip: string | null
          language: string | null
          path: string
          referrer: string | null
          region: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          device?: string | null
          id?: string
          ip?: string | null
          language?: string | null
          path?: string
          referrer?: string | null
          region?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          device?: string | null
          id?: string
          ip?: string | null
          language?: string | null
          path?: string
          referrer?: string | null
          region?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_admin_if_none: { Args: never; Returns: Json }
      close_pos_shift: {
        Args: { _counted_cash?: number; _note?: string }
        Returns: Json
      }
      create_pos_sale:
        | {
            Args: {
              _items: Json
              _note?: string
              _paid_amount?: number
              _payment_method?: string
            }
            Returns: Json
          }
        | {
            Args: {
              _customer_name?: string
              _discount?: number
              _items: Json
              _note?: string
              _paid_amount?: number
              _payment_method?: string
            }
            Returns: Json
          }
      current_pos_shift: { Args: never; Returns: Json }
      delete_pos_shift: { Args: { _id: string }; Returns: undefined }
      get_order_by_number: { Args: { _order_number: string }; Returns: Json }
      grant_admin_by_email: { Args: { _email: string }; Returns: Json }
      grant_role_by_email: {
        Args: { _email: string; _role: Database["public"]["Enums"]["app_role"] }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_admins: {
        Args: never
        Returns: {
          created_at: string
          email: string
          user_id: string
        }[]
      }
      list_staff: {
        Args: never
        Returns: {
          created_at: string
          email: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      log_action: {
        Args: {
          _action: string
          _details?: Json
          _entity: string
          _entity_id: string
        }
        Returns: undefined
      }
      open_pos_shift: {
        Args: { _note?: string; _opening_cash?: number }
        Returns: Json
      }
      pos_scan: { Args: { _code: string }; Returns: Json }
      refund_pos_sale: {
        Args: { _items?: Json; _reason?: string; _sale_id: string }
        Returns: Json
      }
      revoke_admin: { Args: { _user_id: string }; Returns: undefined }
      revoke_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user" | "manager" | "editor"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "manager", "editor"],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
