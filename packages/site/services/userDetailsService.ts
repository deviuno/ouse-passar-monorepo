// Service for fetching detailed user information for admin panel
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  role: string;
  is_active: boolean;
  show_answers: boolean;
  is_ouse_questoes_subscriber: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreparatorio {
  id: string;
  nome: string;
  slug: string;
  logo_url?: string;
  purchased_at: string;
  status: string;
  product_type: string; // 'Planejador', 'Simulado', 'Reta Final', 'Turma de Elite', etc.
  user_trail_id?: string;
  // Battery info (only for Turma de Elite)
  battery_current?: number;
  has_unlimited_battery?: boolean;
  bonus_battery?: number;
}

export interface UserActivity {
  id: string;
  type: 'mission_completed' | 'question_answered' | 'achievement_earned' | 'level_up';
  description: string;
  timestamp: string;
  metadata?: any;
}

export interface UserMissionProgress {
  mission_id: string;
  mission_title: string;
  preparatorio_nome: string;
  rodada_numero: number;
  status: 'not_started' | 'in_progress' | 'completed';
  score?: number;
  completed_at?: string;
}

export interface UserStats {
  totalMissions: number;
  completedMissions: number;
  completionRate: number;
  averageScore: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  lastActivity: string;
}

export interface UserDetailsData {
  profile: UserProfile;
  stats: UserStats;
  preparatorios: UserPreparatorio[];
  recentActivity: UserActivity[];
  missionProgress: UserMissionProgress[];
}

/**
 * Get complete user details for admin panel
 */
export async function getUserDetails(userId: string): Promise<{
  data: UserDetailsData | null;
  error: string | null;
}> {
  try {
    // Fetch user profile from admin_users
    const { data: profile, error: profileError } = await supabase
      .from('admin_users' as any)
      .select('id, email, name, role, is_active, show_answers, is_ouse_questoes_subscriber, avatar_url, created_at, updated_at, created_by, last_login, password_hash')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('[userDetailsService] Error fetching profile:', profileError);
      return { data: null, error: profileError.message };
    }

    if (!profile) {
      return { data: null, error: 'User not found' };
    }

    // Fetch user's products from multiple sources
    const preparatorios: UserPreparatorio[] = [];

    // 1. Planejador (from leads table)
    const { data: leads } = await supabase
      .from('leads')
      .select('id, created_at, planejamento_id')
      .eq('user_id', userId);

    if (leads && leads.length > 0) {
      const planejamentoIds = [...new Set(leads.map((l: any) => l.planejamento_id).filter(Boolean))];

      if (planejamentoIds.length > 0) {
        const { data: planejamentos } = await supabase
          .from('planejamentos')
          .select('id, preparatorio_id, preparatorios(id, nome, slug, logo_url)')
          .in('id', planejamentoIds);

        if (planejamentos) {
          planejamentos.forEach((planj: any) => {
            if (planj.preparatorios) {
              const lead = leads.find((l: any) => l.planejamento_id === planj.id);
              preparatorios.push({
                id: planj.preparatorios.id,
                nome: planj.preparatorios.nome,
                slug: planj.preparatorios.slug,
                logo_url: planj.preparatorios.logo_url,
                purchased_at: lead?.created_at || new Date().toISOString(),
                status: 'active',
                product_type: 'Planejador',
              });
            }
          });
        }
      }
    }

    // 2. Courses (Simulados, Reta Final, Turma de Elite)
    const { data: userCourses } = await supabase
      .from('user_courses' as any)
      .select('id, course_id, purchased_at')
      .eq('user_id', userId);

    if (userCourses && userCourses.length > 0) {
      const courseIds = userCourses.map((uc: any) => uc.course_id);

      if (courseIds.length > 0) {
        const { data: courses } = await supabase
          .from('courses' as any)
          .select('id, title, image_url, course_type')
          .in('id', courseIds);

        if (courses) {
          courses.forEach((course: any) => {
            const userCourse = userCourses.find((uc: any) => uc.course_id === course.id);
            preparatorios.push({
              id: course.id,
              nome: course.title,
              slug: course.id,
              logo_url: course.image_url,
              purchased_at: (userCourse as any)?.purchased_at || new Date().toISOString(),
              status: 'active',
              product_type: course.course_type || 'Curso',
            });
          });
        }
      }
    }

    // 3. Store Items (produtos da loja com preparatório vinculado)
    const { data: storePurchases } = await supabase
      .from('store_purchases' as any)
      .select('id, item_id, created_at')
      .eq('user_id', userId);

    if (storePurchases && storePurchases.length > 0) {
      const itemIds = storePurchases.map((sp: any) => sp.item_id);

      if (itemIds.length > 0) {
        const { data: storeItems } = await supabase
          .from('store_items' as any)
          .select('id, name, image_url, product_type, preparatorio_id')
          .in('id', itemIds)
          .not('preparatorio_id', 'is', null);

        if (storeItems) {
          storeItems.forEach((item: any) => {
            const purchase = storePurchases.find((sp: any) => sp.item_id === item.id);
            preparatorios.push({
              id: item.id,
              nome: item.name,
              slug: item.id,
              logo_url: item.image_url,
              purchased_at: (purchase as any)?.created_at || new Date().toISOString(),
              status: 'active',
              product_type: item.product_type || 'Produto',
            });
          });
        }
      }
    }

    // 4. Turma de Elite / Trilha de Questões (user_trails - matrículas no app de questões)
    const { data: userTrails } = await supabase
      .from('user_trails' as any)
      .select('id, preparatorio_id, created_at, is_reta_final, battery_current, has_unlimited_battery, bonus_battery, purchased_products')
      .eq('user_id', userId);

    if (userTrails && userTrails.length > 0) {
      const trailPreparatorioIds = [...new Set(userTrails.map((ut: any) => ut.preparatorio_id).filter(Boolean))];

      if (trailPreparatorioIds.length > 0) {
        const { data: trailPreparatorios } = await supabase
          .from('preparatorios')
          .select('id, nome, slug, logo_url')
          .in('id', trailPreparatorioIds);

        if (trailPreparatorios) {
          trailPreparatorios.forEach((prep: any) => {
            const trail = userTrails.find((ut: any) => ut.preparatorio_id === prep.id);
            const purchasedProducts: string[] = (trail as any)?.purchased_products || ['turma_elite'];

            // Map product type codes to display names
            const productTypeNames: Record<string, string> = {
              'turma_elite': 'Turma de Elite',
              'trilha_questoes': 'Trilha de Questões',
              'reta_final': 'Reta Final',
              'simulado': 'Simulado',
              'plataforma_completa': 'Plataforma Completa',
            };

            // Create one entry per purchased product
            purchasedProducts.forEach((productCode: string) => {
              preparatorios.push({
                id: prep.id,
                nome: prep.nome,
                slug: prep.slug,
                logo_url: prep.logo_url,
                purchased_at: (trail as any)?.created_at || new Date().toISOString(),
                status: 'active',
                product_type: productTypeNames[productCode] || productCode,
                user_trail_id: (trail as any)?.id,
                // Battery info (only show for first product to avoid duplicates)
                battery_current: (trail as any)?.battery_current,
                has_unlimited_battery: (trail as any)?.has_unlimited_battery ?? false,
                bonus_battery: (trail as any)?.bonus_battery ?? 0,
              });
            });
          });
        }
      }
    }

    // Fetch mission progress (simplified - based on actual table structure)
    const { data: missionsExecutadas, error: missionsError } = await supabase
      .from('missoes_executadas')
      .select('user_id, planejamento_id, rodada_numero, missao_numero, completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(20);

    const missionProgress: UserMissionProgress[] = [];
    if (missionsExecutadas && !missionsError) {
      missionsExecutadas.forEach((me: any) => {
        missionProgress.push({
          mission_id: `${me.planejamento_id}-${me.rodada_numero}-${me.missao_numero}`,
          mission_title: `Missão ${me.missao_numero}`,
          preparatorio_nome: 'Preparatório', // Will be populated if we join with planejamentos
          rodada_numero: me.rodada_numero,
          status: 'completed',
          score: undefined,
          completed_at: me.completed_at,
        });
      });
    }

    // Build recent activity from missions executed
    const recentActivity: UserActivity[] = [];

    if (missionsExecutadas && !missionsError) {
      missionsExecutadas.forEach((me: any) => {
        recentActivity.push({
          id: `mission_${me.planejamento_id}_${me.rodada_numero}_${me.missao_numero}`,
          type: 'mission_completed',
          description: `Completou Missão ${me.missao_numero} da Rodada ${me.rodada_numero}`,
          timestamp: me.completed_at,
        });
      });
    }

    // Calculate stats from mission data
    const totalMissions = missionProgress.length;
    const completedMissions = missionProgress.filter(m => m.status === 'completed').length;
    const completionRate = totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 100;

    const scoresArray = missionProgress
      .filter(m => m.score !== undefined && m.score !== null)
      .map(m => m.score!);
    const averageScore = scoresArray.length > 0
      ? Math.round(scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length)
      : 0;

    const stats: UserStats = {
      totalMissions,
      completedMissions,
      completionRate,
      averageScore,
      totalQuestions: 0, // Not available in current structure
      correctAnswers: 0, // Not available in current structure
      accuracy: 0, // Not available in current structure
      lastActivity: recentActivity.length > 0 ? recentActivity[0].timestamp : (profile as any).updated_at,
    };

    // Ensure is_ouse_questoes_subscriber defaults to false if null
    const normalizedProfile: UserProfile = {
      ...(profile as any),
      is_ouse_questoes_subscriber: (profile as any).is_ouse_questoes_subscriber ?? false,
    };

    return {
      data: {
        profile: normalizedProfile,
        stats,
        preparatorios,
        recentActivity: recentActivity.slice(0, 20),
        missionProgress,
      },
      error: null,
    };
  } catch (err: any) {
    console.error('[userDetailsService] Exception:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Update user profile information (admin_users table)
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    name?: string;
    email?: string;
    is_active?: boolean;
  }
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('admin_users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('[userDetailsService] Error updating profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('[userDetailsService] Exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update user settings (is_active, show_answers, is_ouse_questoes_subscriber)
 *
 * Nota: is_ouse_questoes_subscriber dá acesso ilimitado APENAS na rota /praticar.
 * Outros produtos (Trilha de Questões, Turma de Elite, Simulados, etc.) têm suas próprias regras.
 */
export async function updateUserSettings(
  userId: string,
  updates: {
    is_active?: boolean;
    show_answers?: boolean;
    is_ouse_questoes_subscriber?: boolean;
  }
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('admin_users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('[userDetailsService] Error updating settings:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('[userDetailsService] Exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Recharge battery for a user trail (Turma de Elite enrollment)
 * Sets battery_current to 100 (default max)
 */
export async function rechargeBattery(
  userTrailId: string
): Promise<{ success: boolean; newBattery?: number; error: string | null }> {
  try {
    const BATTERY_MAX = 100;

    // Update battery_current to max
    const { error: updateError } = await supabase
      .from('user_trails' as any)
      .update({
        battery_current: BATTERY_MAX,
        battery_last_recharge: new Date().toISOString().split('T')[0] // YYYY-MM-DD
      })
      .eq('id', userTrailId);

    if (updateError) {
      console.error('[userDetailsService] Error recharging battery:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true, newBattery: BATTERY_MAX, error: null };
  } catch (err: any) {
    console.error('[userDetailsService] Exception:', err);
    return { success: false, error: err.message };
  }
}

export interface AvailablePreparatorio {
  id: string;
  nome: string;
  slug: string;
  logo_url?: string;
  products: {
    type: string;
    name: string;
    available: boolean;
  }[];
}

/**
 * Get all available preparatórios with their products for admin to assign to users
 */
export async function getAvailablePreparatorios(): Promise<{
  data: AvailablePreparatorio[] | null;
  error: string | null;
}> {
  try {
    const { data: preparatorios, error } = await supabase
      .from('preparatorios')
      .select('id, nome, slug, logo_url, preco_planejador, preco_simulados, preco_reta_final, preco_plataforma_completa, preco_trilhas, preco_8_questoes, checkout_ouse_questoes')
      .eq('is_active', true)
      .order('nome');

    if (error) {
      console.error('[userDetailsService] Error fetching preparatorios:', error);
      return { data: null, error: error.message };
    }

    const result: AvailablePreparatorio[] = (preparatorios || []).map((prep: any) => ({
      id: prep.id,
      nome: prep.nome,
      slug: prep.slug,
      logo_url: prep.logo_url,
      products: [
        { type: 'planejador', name: 'Planejador', available: !!prep.preco_planejador },
        { type: 'simulado', name: 'Simulados', available: !!prep.preco_simulados },
        { type: 'reta_final', name: 'Reta Final', available: !!prep.preco_reta_final },
        { type: 'turma_elite', name: 'Turma de Elite (Questões)', available: !!prep.preco_8_questoes || !!prep.checkout_ouse_questoes },
        { type: 'trilha_questoes', name: 'Trilha de Questões', available: !!prep.preco_trilhas },
        { type: 'plataforma_completa', name: 'Plataforma Completa', available: !!prep.preco_plataforma_completa },
      ],
    }));

    return { data: result, error: null };
  } catch (err: any) {
    console.error('[userDetailsService] Exception:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Add preparatorio products to a user
 */
export async function addUserPreparatorio(
  userId: string,
  preparatorioId: string,
  productTypes: string[]
): Promise<{ success: boolean; error: string | null }> {
  try {
    const errors: string[] = [];

    for (const productType of productTypes) {
      let insertError = null;

      switch (productType) {
        case 'planejador':
          // Get planejamento_id for this preparatorio
          const { data: planejamento } = await supabase
            .from('planejamentos')
            .select('id')
            .eq('preparatorio_id', preparatorioId)
            .limit(1)
            .single();

          if (planejamento) {
            const { error } = await supabase
              .from('leads' as any)
              .upsert({
                user_id: userId,
                planejamento_id: planejamento.id,
                created_at: new Date().toISOString(),
              } as any, { onConflict: 'user_id,planejamento_id' });
            insertError = error;
          } else {
            errors.push('Planejamento não encontrado para este preparatório');
          }
          break;

        case 'turma_elite':
        case 'trilha_questoes':
          // Check if user already has a trail for this preparatorio
          const { data: existingTrail } = await supabase
            .from('user_trails' as any)
            .select('id, purchased_products')
            .eq('user_id', userId)
            .eq('preparatorio_id', preparatorioId)
            .single();

          if (existingTrail) {
            // Update existing trail - add product to array if not already there
            const currentProducts: string[] = (existingTrail as any).purchased_products || [];
            if (!currentProducts.includes(productType)) {
              const { error: updateError } = await supabase
                .from('user_trails' as any)
                .update({
                  purchased_products: [...currentProducts, productType],
                  updated_at: new Date().toISOString(),
                })
                .eq('id', (existingTrail as any).id);
              insertError = updateError;
            }
          } else {
            // Create new trail with product
            const { error: trailError } = await supabase
              .from('user_trails' as any)
              .insert({
                user_id: userId,
                preparatorio_id: preparatorioId,
                is_reta_final: false,
                battery_current: 100,
                has_unlimited_battery: false,
                bonus_battery: 0,
                purchased_products: [productType],
                created_at: new Date().toISOString(),
              });
            insertError = trailError;
          }
          break;

        case 'reta_final':
          // Check if user already has a trail for this preparatorio
          const { data: existingRetaTrail } = await supabase
            .from('user_trails' as any)
            .select('id, purchased_products')
            .eq('user_id', userId)
            .eq('preparatorio_id', preparatorioId)
            .single();

          if (existingRetaTrail) {
            const currentRetaProducts: string[] = (existingRetaTrail as any).purchased_products || [];
            if (!currentRetaProducts.includes('reta_final')) {
              const { error: updateRetaError } = await supabase
                .from('user_trails' as any)
                .update({
                  purchased_products: [...currentRetaProducts, 'reta_final'],
                  is_reta_final: true,
                  has_reta_final_access: true,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', (existingRetaTrail as any).id);
              insertError = updateRetaError;
            }
          } else {
            const { error: retaError } = await supabase
              .from('user_trails' as any)
              .insert({
                user_id: userId,
                preparatorio_id: preparatorioId,
                is_reta_final: true,
                battery_current: 100,
                has_unlimited_battery: false,
                bonus_battery: 0,
                purchased_products: ['reta_final'],
                created_at: new Date().toISOString(),
              });
            insertError = retaError;
          }
          break;

        case 'simulado':
          // Simulados are typically stored in user_courses, check if there's a course for this preparatorio
          const { data: simuladoCourse } = await supabase
            .from('courses' as any)
            .select('id')
            .eq('preparatorio_id', preparatorioId)
            .eq('course_type', 'Simulado')
            .limit(1)
            .single();

          if (simuladoCourse) {
            const { error } = await supabase
              .from('user_courses' as any)
              .upsert({
                user_id: userId,
                course_id: (simuladoCourse as any).id,
                purchased_at: new Date().toISOString(),
              } as any, { onConflict: 'user_id,course_id' });
            insertError = error;
          } else {
            // If no course exists, add to user_trails as fallback
            const { error } = await supabase
              .from('user_trails' as any)
              .upsert({
                user_id: userId,
                preparatorio_id: preparatorioId,
                is_reta_final: false,
                battery_current: 100,
                has_unlimited_battery: false,
                bonus_battery: 0,
                created_at: new Date().toISOString(),
              }, { onConflict: 'user_id,preparatorio_id' });
            insertError = error;
          }
          break;

        case 'plataforma_completa':
          // Check if user already has a trail for this preparatorio
          const { data: existingPlataformaTrail } = await supabase
            .from('user_trails' as any)
            .select('id, purchased_products')
            .eq('user_id', userId)
            .eq('preparatorio_id', preparatorioId)
            .single();

          if (existingPlataformaTrail) {
            const currentPlataformaProducts: string[] = (existingPlataformaTrail as any).purchased_products || [];
            if (!currentPlataformaProducts.includes('plataforma_completa')) {
              const { error: updatePlataformaError } = await supabase
                .from('user_trails' as any)
                .update({
                  purchased_products: [...currentPlataformaProducts, 'plataforma_completa'],
                  has_unlimited_battery: true,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', (existingPlataformaTrail as any).id);
              insertError = updatePlataformaError;
            }
          } else {
            const { error: plataformaError } = await supabase
              .from('user_trails' as any)
              .insert({
                user_id: userId,
                preparatorio_id: preparatorioId,
                is_reta_final: false,
                battery_current: 100,
                has_unlimited_battery: true,
                bonus_battery: 0,
                purchased_products: ['plataforma_completa'],
                created_at: new Date().toISOString(),
              });
            insertError = plataformaError;
          }
          break;

        default:
          errors.push(`Tipo de produto desconhecido: ${productType}`);
      }

      if (insertError) {
        console.error(`[userDetailsService] Error adding ${productType}:`, insertError);
        errors.push(`Erro ao adicionar ${productType}: ${insertError.message}`);
      }
    }

    if (errors.length > 0) {
      return { success: false, error: errors.join('; ') };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('[userDetailsService] Exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Remove a product from a user's preparatorio access
 * If the user has no more products for that preparatorio, the trail is deleted
 */
export async function removeUserProduct(
  userId: string,
  preparatorioId: string,
  productType: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Map display names back to product codes
    const productCodeMap: Record<string, string> = {
      'Turma de Elite': 'turma_elite',
      'Trilha de Questões': 'trilha_questoes',
      'Reta Final': 'reta_final',
      'Simulado': 'simulado',
      'Plataforma Completa': 'plataforma_completa',
    };

    const productCode = productCodeMap[productType] || productType;

    // Get the current trail
    const { data: trail, error: fetchError } = await supabase
      .from('user_trails' as any)
      .select('id, purchased_products')
      .eq('user_id', userId)
      .eq('preparatorio_id', preparatorioId)
      .single();

    if (fetchError || !trail) {
      return { success: false, error: 'Registro não encontrado' };
    }

    const currentProducts: string[] = (trail as any).purchased_products || [];
    const updatedProducts = currentProducts.filter((p: string) => p !== productCode);

    if (updatedProducts.length === 0) {
      // No more products - delete the entire trail
      const { error: deleteError } = await supabase
        .from('user_trails' as any)
        .delete()
        .eq('id', (trail as any).id);

      if (deleteError) {
        console.error('[userDetailsService] Error deleting trail:', deleteError);
        return { success: false, error: deleteError.message };
      }
    } else {
      // Update the trail with remaining products
      const { error: updateError } = await supabase
        .from('user_trails' as any)
        .update({
          purchased_products: updatedProducts,
          updated_at: new Date().toISOString(),
        })
        .eq('id', (trail as any).id);

      if (updateError) {
        console.error('[userDetailsService] Error updating trail:', updateError);
        return { success: false, error: updateError.message };
      }
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('[userDetailsService] Exception:', err);
    return { success: false, error: err.message };
  }
}
