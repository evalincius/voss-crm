import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralTab } from "./settings/GeneralTab";
import { MembersTab } from "./settings/MembersTab";
import { InvitationsTab } from "./settings/InvitationsTab";
import { DangerZone } from "./settings/DangerZone";

export function OrgSettingsView() {
  return (
    <div>
      <h2 className="font-heading text-text-primary mb-6 text-2xl font-bold">
        Organization Settings
      </h2>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <GeneralTab />
          <DangerZone />
        </TabsContent>

        <TabsContent value="members">
          <MembersTab />
        </TabsContent>

        <TabsContent value="invitations">
          <InvitationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
