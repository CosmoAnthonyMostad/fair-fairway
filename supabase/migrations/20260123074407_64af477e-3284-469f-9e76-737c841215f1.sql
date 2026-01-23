-- Update handle_new_user function with input validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path TO 'public'
AS $function$
DECLARE
  clean_display_name TEXT;
BEGIN
  -- Extract and validate display name
  clean_display_name := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data ->> 'display_name'), ''),
    SPLIT_PART(new.email, '@', 1)
  );
  
  -- Enforce reasonable length limit (50 chars max)
  IF LENGTH(clean_display_name) > 50 THEN
    clean_display_name := LEFT(clean_display_name, 50);
  END IF;
  
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (new.id, clean_display_name, new.email);
  
  RETURN new;
END;
$function$;

-- Add validation trigger for profiles table updates
CREATE OR REPLACE FUNCTION public.validate_profile_data()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate display_name length
  IF NEW.display_name IS NOT NULL AND LENGTH(NEW.display_name) > 50 THEN
    NEW.display_name := LEFT(NEW.display_name, 50);
  END IF;
  
  -- Validate home_city length
  IF NEW.home_city IS NOT NULL AND LENGTH(NEW.home_city) > 100 THEN
    NEW.home_city := LEFT(NEW.home_city, 100);
  END IF;
  
  -- Validate PHI range
  IF NEW.phi IS NOT NULL THEN
    IF NEW.phi < -10 THEN
      NEW.phi := -10;
    ELSIF NEW.phi > 54 THEN
      NEW.phi := 54;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for profile validation (if not exists)
DROP TRIGGER IF EXISTS validate_profile_before_update ON public.profiles;
CREATE TRIGGER validate_profile_before_update
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_profile_data();

-- Add validation trigger for groups table
CREATE OR REPLACE FUNCTION public.validate_group_data()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate group name length (50 chars max)
  IF NEW.name IS NOT NULL AND LENGTH(NEW.name) > 50 THEN
    NEW.name := LEFT(NEW.name, 50);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for group validation
DROP TRIGGER IF EXISTS validate_group_before_update ON public.groups;
CREATE TRIGGER validate_group_before_update
BEFORE INSERT OR UPDATE ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.validate_group_data();