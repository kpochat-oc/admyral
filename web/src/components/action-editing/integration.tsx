"use client";

import { Flex, Select, Text, TextArea, TextField } from "@radix-ui/themes";
import CopyText from "../copy-text";
import { generateReferenceHandle } from "@/lib/workflow-node";
import { cloneDeep } from "lodash";
import {
	Credential,
	IntegrationData,
	IntegrationType,
	getIntegrationTypeLabel,
} from "@/lib/types";
import useWorkflowStore from "@/lib/workflow-store";
import IntegrationLogoIconCard from "../integration-logo-icon-card";
import { INTEGRATIONS } from "@/lib/integrations";
import Link from "next/link";
import ArrowRightUpIcon from "../icons/arrow-right-up";
import { useEffect, useState } from "react";
import { listCredentials } from "@/lib/api";

export interface IntegrationProps {
	id: string;
}

export default function Integration({ id }: IntegrationProps) {
	const { data, updateData } = useWorkflowStore((state) => ({
		data: state.nodes.find((node) => node.id === id)
			?.data as IntegrationData,
		updateData: (updatedData: IntegrationData) =>
			state.updateNodeData(id, updatedData),
	}));
	const [availableCredentials, setAvailableCredentials] = useState<string[]>(
		[],
	);

	const integrationType = (data.actionDefinition as any).integrationType;
	const apiId = (data.actionDefinition as any).api;
	const requiresAuthentication = INTEGRATIONS[integrationType].apis.find(
		(api) => api.id === apiId,
	)?.requiresAuthentication;

	useEffect(() => {
		if (!requiresAuthentication) {
			return;
		}

		// if the credential is already selected, then we already know that it exists
		// and we add it directly to the available credentials so that it is immediately
		// shown in the UI
		const previouslySelectedCredential = (data.actionDefinition as any)
			.credential;
		setAvailableCredentials(
			previouslySelectedCredential ? [previouslySelectedCredential] : [],
		);

		listCredentials((data.actionDefinition as any).integrationType)
			.then((credentials: Credential[]) => {
				if (
					(data.actionDefinition as any).credential &&
					!credentials.find(
						(c) =>
							c.name ===
							(data.actionDefinition as any).credential,
					)
				) {
					// The credential does not exist anymore! Hence, we reset the selected the credential
					const clonedData = cloneDeep(data);
					(clonedData.actionDefinition as any).credential = "";
					updateData(clonedData);
					// Note: the following alert is shown twice in development mode due to react strictmode which renders every component twice
					alert(
						`The previously selected credential for ${data.actionName} does not exist anymore. Please select a new one.`,
					);
				}

				setAvailableCredentials(
					credentials.map(
						(credential: Credential) => credential.name,
					),
				);
			})
			.catch((error) => {
				alert(
					"Failed to fetch available credentials. Please unselect and select the integration node again.",
				);
			});
	}, [id]);

	const integration =
		INTEGRATIONS[
			(data.actionDefinition as any).integrationType as IntegrationType
		];
	const apiDefinition =
		integration.apis[
			integration.apis.findIndex(
				(api) => api.id === (data.actionDefinition as any).api,
			)
		];

	return (
		<Flex direction="column" gap="4" p="4">
			<Flex gap="4" align="center">
				<IntegrationLogoIconCard
					integration={integration.integrationType}
				/>

				<Flex direction="column">
					<Text weight="medium">
						{getIntegrationTypeLabel(integration.integrationType)}
					</Text>
					<Text color="gray" weight="light">
						{apiDefinition.name}
					</Text>
					{apiDefinition.documentationUrl && (
						<Link
							href={apiDefinition.documentationUrl}
							target="_blank"
							style={{
								color: "var(--Accent-color-Accent-9, #3E63DD)",
							}}
						>
							<Flex justify="start" align="center">
								<Text>Documentation</Text>
								<ArrowRightUpIcon />
							</Flex>
						</Link>
					)}
				</Flex>
			</Flex>

			<Flex direction="column" gap="2">
				<Text>Name</Text>
				<TextField.Root
					variant="surface"
					value={data.actionName}
					onChange={(event) => {
						// Update name in the state
						const clonedData = cloneDeep(data);
						clonedData.actionName = event.target.value;
						clonedData.referenceHandle = generateReferenceHandle(
							event.target.value,
						);
						updateData(clonedData);
					}}
				/>
			</Flex>

			<Flex direction="column" gap="2">
				<Text>Reference Handle</Text>
				<CopyText text={data.referenceHandle} />
			</Flex>

			<Flex direction="column" gap="2">
				<Text>Description</Text>
				<TextArea
					size="2"
					variant="surface"
					resize="vertical"
					value={data.actionDescription}
					style={{ height: "150px" }}
					onChange={(event) => {
						const clonedData = cloneDeep(data);
						clonedData.actionDescription = event.target.value;
						updateData(clonedData);
					}}
				/>
			</Flex>

			<Text weight="medium">API Parameters</Text>

			{requiresAuthentication && (
				<Flex direction="column" gap="2">
					<Text>Credential</Text>
					<Select.Root
						value={(data.actionDefinition as any).credential}
						onValueChange={(credential) => {
							const clonedData = cloneDeep(data);
							(clonedData.actionDefinition as any).credential =
								credential;
							updateData(clonedData);
						}}
					>
						<Select.Trigger placeholder="Select a credential" />
						<Select.Content>
							{availableCredentials.map((credential: string) => (
								<Select.Item
									key={credential}
									value={credential}
								>
									{credential}
								</Select.Item>
							))}
						</Select.Content>
					</Select.Root>
				</Flex>
			)}

			{apiDefinition.parameters.map((parameter) => (
				<Flex direction="column" gap="2" key={parameter.id}>
					<Text>
						{parameter.displayName}
						{parameter.required ? "" : " (Optional)"}
					</Text>
					<TextField.Root
						variant="surface"
						value={
							(data.actionDefinition as any).params[parameter.id]
						}
						onChange={(event) => {
							const clonedData = cloneDeep(data);
							(clonedData.actionDefinition as any).params[
								parameter.id
							] = event.target.value;
							updateData(clonedData);
						}}
					/>
				</Flex>
			))}
		</Flex>
	);
}
